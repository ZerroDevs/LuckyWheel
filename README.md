# Lucky Wheel & Gamble Casino 🎰🎲🃏

A modern, feature-rich web application for making random decisions and playing luck-based casino games with style. Features a customizable spinning wheel, 3D dice roller, and multiple gambling modes built with HTML, CSS, and Vanilla JavaScript.

## Features ✨

### 🎡 Lucky Wheel
- **Multiple Wheels**: Spin up to 4 wheels simultaneously in a responsive grid layout.
- **Custom Weights**: Assign specific weights to entries to change their probabilities. Visual slice sizes scale perfectly based on weights! (Supports decimal weights).
- **Customization**: Add images to slices, pick specific slice colors, and choose from multiple color themes.
- **Physics & Animation**: Smooth spinning animations with realistic easing and interactive pointer ticks. Optimized canvas rendering for high FPS.

### 🎲 3D Dice Roller
- **Multi-Dice Support**: Roll up to 4 dice at the same time.
- **Custom Faces**: Map your entries (text or images) to the faces of the dice.
- **Weighted Probabilities**: Dice rolls respect the weights you set for your entries.

### 🎰 Casino & Luck Games
- **Slots**: A fully animated slot machine where your entries serve as the reels! Pull the lever and see if you get a match.
- **Mystery Box**: Open 3D treasure chests to reveal an entry chosen by luck.
- **Blackjack**: Play a round of Double or Nothing against a dealer with fully animated cards dealing from the shoe.
- **Coin Flip**: A simple 3D coin toss (Heads or Tails) that selects from your entries based on their weighted probability.

### ⚙️ Core Features
- **Themes**: Toggle between Light and Dark mode.
- **Sound Effects**: Synthesized Web Audio API sound effects for spinning, ticking, bouncing, and victory fanfares. Allows custom audio file uploads for the victory sound.
- **Confetti**: Celebratory confetti effects when a winner is chosen.
- **History & Stats**: Built-in history panel to track previous winners, complete with an "Elimination Mode" (removes winners automatically). Export history to CSV or JSON.
- **Data Persistence**: Automatically saves your entries, settings, and history locally.
- **Sharing**: Share your specific wheel configuration via a generated URL or QR code.

## Running Locally 🚀

This is a static web app. To run it, simply open the `index.html` file in your browser, or use a local development server for a better experience (recommended for certain browser security policies regarding local storage and audio):

1. **Clone the repository** or download the files.
2. **Open in browser**:
   - Double click `index.html`.
   - OR use a live server extension in your editor (e.g., VS Code Live Server).
   - OR run a simple Python server:
     ```bash
     python -m http.server 8000
     ```
     Then navigate to `http://localhost:8000`.

## Tech Stack 🛠️
- **Frontend**: HTML5, Vanilla JavaScript, CSS3
- **Graphics**: HTML Canvas API for the Wheel, CSS 3D Transforms for the Dice
- **Audio**: Web Audio API

## Customization & Controls
- Press `Space` to spin the wheel or roll the dice.
- Press `E` to open the Entries editor.
- Press `H` to view roll History.
- Press `T` to toggle the Light/Dark theme.

## Author 👤
**ZerroDevs**
- GitHub: [@ZerroDevs](https://github.com/ZerroDevs)

## License 📄
This project is licensed under a strict **Non-Commercial License**. You are free to use, modify, and distribute this software for personal or educational purposes, but **you are strictly prohibited from selling it, monetizing it, or using it for any commercial purposes**. See the [LICENSE](LICENSE) file for full details.
