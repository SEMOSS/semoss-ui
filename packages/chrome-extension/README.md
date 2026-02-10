# Workshop Automation Assistant - Chrome Extension

A Chrome extension for browser automation using the Workshop AI platform. This extension provides an AI-powered interface for automating browser tasks through natural language commands or pre-recorded scripts.

## Features

- **Side Panel Interface**: Persistent panel that works across all tabs without requiring DevTools
- **LLM Mode**: Natural language commands for browser automation
- **Script Mode**: Execute Playwright or Google Recorder scripts
- **Playground Integration**: Auto-execute commands from the Playground chat interface
- **Real-time Monitoring**: Track automation progress and actions
- **Settings Management**: Configure Workshop API credentials

## Installation

### Development Mode

1. **Build the Extension**
   ```bash
   cd packages/chrome-extension
   npm install
   npm run build
   ```

2. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `build` folder from this project

3. **Configure Settings**
   - Click the Workshop Automation Assistant icon in the toolbar
   - Click "Configure Settings" or right-click the extension icon → Options
   - Enter your Workshop API credentials:
     - Endpoint URL
     - Access Key
     - Secret Key

## Usage

### Accessing the Extension

**Primary Method: Side Panel**
1. Click the Workshop Automation Assistant icon in your Chrome toolbar
2. The side panel opens on the right side of your browser
3. The panel persists across tabs and stays open

**Alternative: DevTools**
1. Press F12 or right-click → Inspect to open DevTools
2. Navigate to the "Workshop AI" panel tab

### LLM Mode

Use natural language to automate browser tasks:

1. In the side panel, ensure "LLM Mode" is selected
2. Enter a command like:
   - "Click the login button"
   - "Fill in the email field with test@example.com"
   - "Navigate to google.com"
3. Click "Run Command" or press Ctrl+Enter
4. Watch the automation execute in real-time

### Script Mode

Execute pre-recorded scripts:

1. Switch to "Script Mode" in the panel
2. Choose between:
   - **Load from Workshop**: Select from saved scripts
   - **Paste JSON**: Paste a Playwright or Google Recorder script
3. Select the script format (Playwright or Google Recorder)
4. Click "Run Script"

### Playground Integration

The extension can monitor and auto-execute commands from the Playground chat:

1. In the side panel, switch to "LLM Mode"
2. Enable "🎮 Auto-execute commands from Playground"
3. Navigate to a Playground room
4. Submit chat messages - they'll automatically execute as automation commands

**Special Commands:**
- "Open new tab [URL]" - Opens a new browser tab
- "Play some script" - Switches to Script mode

See [PLAYGROUND_INTEGRATION.md](./PLAYGROUND_INTEGRATION.md) for detailed documentation.

## Architecture

### Components

- **Background Service Worker** (`src/background/`)
  - Handles debugger attachment
  - Executes browser automation actions
  - Manages side panel opening

- **Content Script** (`src/content/`)
  - Monitors Playground events
  - Forwards messages to the extension

- **Side Panel** (`src/panel/`)
  - Main UI for the extension
  - React-based interface
  - Handles user commands and script execution

- **DevTools Panel** (`src/devtools/`)
  - Alternative access point
  - Same functionality as side panel

### Build System

- **Webpack**: Bundles TypeScript/React code
- **TypeScript**: Type-safe development
- **React**: UI framework
- **Babel**: JavaScript transpilation

## Development

### Project Structure

```
src/
  ├── assets/           # Extension icons
  ├── background/       # Service worker (background tasks)
  ├── content/          # Content script (page interaction)
  ├── devtools/         # DevTools panel registration
  ├── options/          # Settings page
  ├── panel/            # Main UI (React app)
  ├── services/         # API services and script execution
  └── manifest.json     # Extension configuration
```

### Build Commands

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Development build (watch mode)
npm run watch

# Type checking
npm run type-check
```

### Key Technologies

- Chrome Extension Manifest V3
- Chrome Side Panel API
- Chrome Debugger API
- React 18
- TypeScript 5
- Webpack 5

## Permissions

The extension requires the following permissions:

- `tabs` - Access tab information
- `activeTab` - Interact with the active tab
- `storage` - Store settings
- `debugger` - Execute automation actions
- `scripting` - Inject content scripts
- `sidePanel` - Display persistent side panel

## Troubleshooting

### Side Panel Not Opening

- Ensure you're using Chrome 114 or later (Side Panel API requirement)
- Check that the extension is enabled in `chrome://extensions/`
- Reload the extension after rebuilding

### Automation Not Working

- Verify Workshop API credentials in Settings
- Check that the debugger is attached (yellow banner appears)
- Look for error messages in the extension panel
- Open Chrome DevTools Console for detailed logs

### Playground Integration Issues

- Ensure you're on a Playground room page (URL contains `/room/`)
- Check that the content script loaded (inspect page console)
- Verify the Playground application is dispatching events

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## License

See [LICENSE](../../LICENSE) for details.
