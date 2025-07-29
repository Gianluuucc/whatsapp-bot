# WhatsApp Order Bot (Baileys + Render)

Questo bot WhatsApp usa Baileys per ricevere ordini e si collega a un backend PHP (es. su Altervista) per ottenere il menù e registrare ordini.

## 📦 API Backend

Punta a:
- `https://consegneweb.altervista.org/api/menu.php`
- `https://consegneweb.altervista.org/api/place_order.php`

## 🚀 Deploy su Render

1. Carica questi file su un repo GitHub
2. Su [Render.com](https://render.com):
   - Nuovo Web Service
   - Start command: `npm start`
   - Build command: `npm install`
3. Se richiesto il QR code:
   - Esegui `node bot.js` **in locale**
   - Scannerizza
   - Carica la cartella `/auth` su GitHub

## 🧠 Dipendenze

```bash
npm install
```

## ✅ Start

```bash
node bot.js
```
