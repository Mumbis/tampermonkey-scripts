# Redgifs Media Controls

A Tampermonkey/Greasemonkey userscript that adds keyboard controls and pseudo-fullscreen mode for Redgifs videos.

## Features

- **Keyboard Controls** - Control playback without clicking
- **Pseudo-Fullscreen** - Fullscreen mode that works better than the native one
- **Quality Toggle** - Quick switch between SD/HD
- **Audio Toggle** - Mute/unmute with keyboard
- **Video Seeking** - Jump forward/backward or to specific points
- **Settings Sync** - Remembers your quality and audio preferences

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Greasemonkey](https://www.greasespot.net/) browser extension
2. Click here to install: [redgifs-media-controls.user.js](redgifs-media-controls.user.js)
3. Click "Install" when prompted
4. Visit [Redgifs](https://www.redgifs.com/) and enjoy!

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **F** | Toggle pseudo-fullscreen mode |
| **Space** | Play/Pause |
| **M** | Mute/Unmute |
| **Q** | Toggle quality (SD/HD) |
| **A** | Auto-mode (fullscreen + unmute + HD) |
| **←** | Seek backward 5 seconds |
| **→** | Seek forward 5 seconds |
| **0-9** | Jump to 0%-90% of video |

## Why Pseudo-Fullscreen?

The pseudo-fullscreen mode (F key) provides a better experience than the native fullscreen:
- Video stays clear and focused when exiting
- Works more reliably across different page types
- Maintains playback state consistently

## Compatibility

- **Browser:** Chrome, Firefox, Edge, Brave (any browser supporting Tampermonkey/Greasemonkey)
- **Website:** redgifs.com
- **Version:** 2.1.5

## Issues & Contributions

Found a bug or have a suggestion? Feel free to open an issue on the [main repository](../..).

## License

MIT License - Feel free to modify and share!
