# Workshop Automation Extension

A Chrome extension for browser automation powered by Workshop AI platform.

## 🚀 Current Status: Phase 1 Complete

### ✅ Completed Features
- Project structure and configuration
- Manifest V3 setup
- Background service worker (basic)
- Content script for DOM extraction
- Popup UI interface
- Settings infrastructure

### 🔄 In Progress
- Phase 2: DOM extraction and simplification
- Phase 3: Workshop LLM integration with SEMOSS SDK
- Phase 4: Action execution system
- Phase 5: Enhanced UI components
- Phase 6: Complete automation loop

## 📋 Setup Instructions

### Prerequisites
- Node.js >= 16
- Chrome browser
- Workshop platform credentials

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Workshop credentials:**
   - Copy `.env.example` to `.env`
   - Update with your Workshop endpoint and app ID:
     ```
     WORKSHOP_ENDPOINT=https://workshop.cfg.deloitte.com/cfg-ai-demo
     WORKSHOP_MODULE=/Monolith
     WORKSHOP_APP_ID=your-app-id-here
     ```

3. **Build the extension:**
   ```bash
   npm run build
   ```
   For development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Load in Chrome:**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `build` folder

## 🎯 How It Works

### Architecture

```
User Command → DOM Extraction → Workshop LLM → Action Parsing → Execution → Loop
```

### Core Components

1. **Content Script** (`src/content/index.ts`)
   - Runs on every webpage
   - Traverses and annotates DOM elements
   - Identifies interactive elements (buttons, inputs, links)
   - Provides element coordinates for actions

2. **Background Script** (`src/background/index.ts`)
   - Manages Chrome debugger API
   - Executes actions (click, setValue, wait)
   - Coordinates between popup and content script

3. **Popup UI** (`src/popup/`)
   - User interface for commands
   - Displays action history
   - Settings configuration

4. **Workshop Integration** (Coming in Phase 3)
   - SEMOSS SDK integration
   - Python backend for LLM calls
   - Action parsing and response handling

## 🛠 Development

### Project Structure
```
my_task/
├── src/
│   ├── background/     # Service worker
│   ├── content/        # Content script
│   ├── popup/          # Popup UI
│   ├── panel/          # DevTools panel
│   ├── constants.ts    # Shared constants
│   ├── types.ts        # TypeScript types
│   └── manifest.json   # Extension manifest
├── build/              # Built extension
├── package.json
├── tsconfig.json
└── webpack.config.js
```

### Available Scripts
- `npm run build` - Production build
- `npm run dev` - Development build with watch mode
- `npm start` - Alias for dev mode

## 🔑 Workshop Integration (Phase 3)

The extension will integrate with Workshop platform similar to the call center app:

1. **SEMOSS SDK Setup:**
   ```javascript
   import { Insight } from '@semoss/sdk';
   const insight = new Insight();
   await insight.initialize({});
   ```

2. **Python Backend:**
   - Create automation.py with action processing logic
   - Use gaas_gpt_model for LLM inference
   - Parse responses for actions

3. **Action Flow:**
   - Send simplified DOM + command to LLM
   - Receive action response
   - Execute via Chrome debugger
   - Repeat until task complete

## 📝 Usage Example

Once complete, you'll be able to:

1. Open the extension (Ctrl+Shift+W)
2. Enter a command: "Search for 'automation tools' on Google"
3. Extension will:
   - Extract page elements
   - Send to Workshop LLM
   - Click search box
   - Type the query
   - Click search button

## 🔒 Security & Privacy

- All processing happens locally
- Workshop credentials stored securely in Chrome storage
- No data sent to third parties
- Chrome debugger requires user consent per tab

## 🐛 Troubleshooting

### TypeScript Errors
These are expected during Phase 1. Install dependencies to resolve:
```bash
npm install
```

### Extension Not Loading
1. Ensure you've run `npm run build`
2. Check the `build` folder exists
3. Look for errors in `chrome://extensions/`

## 📚 Next Steps

### Phase 2: DOM System
- Implement DOM simplification
- Filter non-interactive elements
- Optimize token usage

### Phase 3: LLM Integration
- Set up SEMOSS SDK
- Create Python automation backend
- Implement prompt engineering
- Parse LLM responses

### Phase 4: Actions
- Enhance click functionality
- Implement setValue with focus
- Add navigation actions
- Error handling

## 🤝 Contributing

This is a custom implementation. Refer to the Taxy AI browser-extension and call center folders for reference architecture.

## 📄 License

Private project for Workshop integration.
