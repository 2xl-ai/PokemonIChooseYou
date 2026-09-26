# ⚡ Pokémon: I Choose You! 🍃🔥💧

A fun, kid-friendly mobile web Pokémon game built for a 6-year-old Pokémon Trainer and his dad!

---

## 🎮 Game Features
- **4 Starter Partners:** Choose between **Bulbasaur**, **Pikachu**, **Charmander**, and **Squirtle** anytime!
- **"I CHOOSE YOU!" Hero Move:** Tap to unleash your partner's signature elemental attack (Vine Whip, Thunderbolt, Flamethrower, Water Gun) with cool particles and sounds!
- **Flick to Catch:** Swipe the Pokéball up on your touchscreen to throw it at wild Pokémon!
- **Wobble & Confetti:** Experience the classic 3 wobbles, click sound, and burst of celebratory confetti!
- **Sticker Pokédex:** Track all caught Pokémon and see your collection grow!
- **Level & EXP System:** Level up your Trainer status as you catch more Pokémon.
- **Synthesized 8-Bit Web Audio:** Crisp retro sound effects running directly in browser without loading bulky MP3 files.
- **PWA Mobile-Ready:** Fullscreen portrait experience with zero browser address bars when added to your phone's home screen.

---

## 🚀 How to Run Locally

### 1. Start the Dev Server
```bash
npm run dev
```

### 2. Play on Your Phone (Same Wi-Fi)
Vite runs with `--host` enabled. Look at the terminal output for the **Network URL** (for example: `http://192.168.1.50:5173`).
- Open Safari (iOS) or Chrome (Android) on your phone.
- Type that URL or scan its QR code.
- Tap **"Share" -> "Add to Home Screen"** to play in beautiful fullscreen!

---

## 🛡️ SonarQube Code Scanning
The project includes a ready-to-use `sonar-project.properties` configuration.
- Total project size: **< 700 lines of code** (well within the free 50k LOC tier!).
- Run your existing SonarQube scanner CLI in this directory anytime:
```bash
sonar-scanner
```

---

## 📦 Connecting to GitHub (Private Repo)
1. Create a **Private** repository named `PokemonCatch` on [GitHub](https://github.com/new).
2. Run in terminal:
```bash
git remote add origin git@github.com:<your-username>/PokemonCatch.git
git push -u origin main
```
