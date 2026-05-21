# Ultimate TicTacToe PWA

A strategic twist on classic Tic-Tac-Toe with a chalk-on-blackboard aesthetic. Built with React + Vite, deployable as a Progressive Web App (PWA) — installable on any phone's home screen.

---

## 🚀 Deploy in 5 Steps

### 1. Install dependencies
```bash
npm install
```

### 2. Test locally
```bash
npm run dev
```
Open http://localhost:5173 in your browser. Make sure the game works.

### 3. Push to GitHub
If you haven't already created a repo:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ultimate-tictactoe.git
git push -u origin main
```

### 4. Connect to Netlify
1. Go to [netlify.com](https://netlify.com) and log in
2. Click **"Add new site" → "Import an existing project"**
3. Choose **GitHub** and select your `ultimate-tictactoe` repo
4. Build settings are auto-detected from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click **Deploy site**

### 5. Install on your phone
1. Open your Netlify URL in **Safari (iOS)** or **Chrome (Android)**
2. iOS: Tap the Share button → **"Add to Home Screen"**
3. Android: Tap the menu (⋮) → **"Add to Home Screen"** or watch for the install banner

---

## 🔄 Updating the game
Every time you push to `main`, Netlify auto-deploys. Users with the app installed will get the update silently in the background next time they open it.

```bash
git add .
git commit -m "Your change description"
git push
```

---

## 📁 Project Structure

```
ultimate-tictactoe/
├── public/
│   ├── favicon.svg          # Browser tab icon
│   ├── pwa-192x192.png      # PWA icon (Android)
│   ├── pwa-512x512.png      # PWA icon (splash screen)
│   └── apple-touch-icon.png # iOS home screen icon
├── src/
│   ├── App.jsx              # The game (all logic + UI)
│   ├── main.jsx             # React entry point
│   └── index.css            # Global reset + safe area insets
├── index.html               # HTML shell + font preloads
├── vite.config.js           # Vite + PWA plugin config
├── netlify.toml             # Netlify build + redirect rules
└── package.json
```

---

## 🎮 Game Rules

- 9 mini boards arranged in a 3×3 mega-board
- Where you play determines which mini-board your opponent must play in next
- If sent to a **full board** → game ends immediately, most points wins
- **Scoring**: every 3-in-a-row = 1 point (multiple lines can score per board)
- **Mega bonus**: +3 points to the first player with 3-in-a-row across the mega-board owners
