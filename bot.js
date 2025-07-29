const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const axios = require('axios');

const sessions = {}; // Stato utente per conversazioni

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const sock = makeWASocket({ auth: state });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || !msg.key.remoteJid) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        if (!sessions[from]) sessions[from] = { step: 0, order: {} };
        const session = sessions[from];

        let reply = '';

        switch (session.step) {
            case 0:
                reply = 'Ciao! Vuoi ordinare qualcosa? Scrivi "menu" per iniziare.';
                session.step = 1;
                break;

            case 1:
                if (text.toLowerCase() === 'menu') {
                    const res = await axios.get('https://consegneweb.altervista.org/api/menu.php');
                    const items = res.data;
                    reply = 'Ecco il nostro menù:\n';
                    items.forEach(p => {
                        reply += `${p.id}. ${p.name} - €${p.price}\n`;
                    });
                    reply += '\nRispondi con il numero del prodotto.';
                    session.step = 2;
                } else {
                    reply = 'Scrivi "menu" per iniziare.';
                }
                break;

            case 2:
                const id = parseInt(text);
                if (!isNaN(id)) {
                    const res = await axios.get(`https://consegneweb.altervista.org/api/menu.php?id=${id}`);
                    const prod = res.data;
                    if (prod) {
                        session.order.product_id = prod.id;
                        session.order.product_name = prod.name;
                        reply = `Hai scelto: ${prod.name}. Quante porzioni?`;
                        session.step = 3;
                    } else {
                        reply = 'ID prodotto non valido. Riprova.';
                    }
                } else {
                    reply = 'Rispondi con un numero.';
                }
                break;

            case 3:
                const q = parseInt(text);
                if (q > 0) {
                    session.order.quantity = q;
                    reply = 'Perfetto. Inserisci il tuo indirizzo di consegna:';
                    session.step = 4;
                } else {
                    reply = 'Inserisci una quantità valida.';
                }
                break;

            case 4:
                session.order.address = text;
                reply = `Confermi l’ordine: ${session.order.quantity}x ${session.order.product_name} a "${text}"? (sì/no)`;
                session.step = 5;
                break;

            case 5:
                if (text.toLowerCase().startsWith('s')) {
                    await axios.post('https://consegneweb.altervista.org/api/place_order.php', {
                        product_id: session.order.product_id,
                        quantity: session.order.quantity,
                        address: session.order.address,
                        name: 'Cliente WhatsApp'
                    });
                    reply = '✅ Ordine effettuato con successo!';
                    delete sessions[from];
                } else {
                    reply = 'Ordine annullato. Scrivi "menu" per ricominciare.';
                    delete sessions[from];
                }
                break;
        }

        await sock.sendMessage(from, { text: reply });
    });

    sock.ev.on('creds.update', saveCreds);
}

startBot();
