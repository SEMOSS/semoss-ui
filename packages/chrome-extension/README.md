# SEMOSS Chrome Extension

A Chrome extension for browser automation integrated with the SEMOSS Playground. This extension executes Playwright scripts automatically when triggered from the Playground toolbox, enabling seamless browser automation through natural language prompts.

## Features

- **Playground Integration**: Automatically executes scripts triggered from Playground toolbox
- **Side Panel Interface**: Persistent panel that works across all tabs without requiring DevTools
- **Playwright Script Execution**: Execute browser automation scripts automatically
- **Real-time Monitoring**: Track automation progress and actions in the side panel

## Installation & Build

### Prerequisites

- Node.js (>=18.0.0)
- pnpm package manager (~10.13.0)
- Google Chrome (version 114 or later)

### Building the Extension

1. **Navigate to the Extension Directory**
   ```bash
   cd packages/chrome-extension
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Build the Extension**
   ```bash
   pnpm run build
   ```
   
   This creates an optimized build in the `build/` folder.

### Installing in Chrome

The extension is installed locally using Chrome's "Load unpacked" feature:

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/` in Google Chrome
   - Or click the three-dot menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle the **"Developer mode"** switch in the top right corner

3. **Load the Extension**
   - Click the **"Load unpacked"** button
   - Navigate to the `packages/chrome-extension/build` folder in your file system
   - Select the `build` folder and click "Select Folder"

4. **Verify Installation**
   - The extension should now appear in your extensions list
   - The SEMOSS Chrome Extension icon should be visible in your Chrome toolbar
   - If not visible in toolbar, click the puzzle piece icon and pin it

### Updating the Extension

After making code changes:

1. Make your code changes
2. Update the version number in `src/manifest.json` (optional but recommended)
3. Rebuild: `pnpm run build`
4. Go to `chrome://extensions/`
5. Click the refresh icon on the SEMOSS Chrome Extension card
6. The updated extension is now active

## How It Works

The SEMOSS Chrome Extension integrates with the Playground to enable browser automation through natural language prompts. Here's the complete workflow:

### Workflow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  1. User has Playwright scripts recorded in a project          │
├─────────────────────────────────────────────────────────────────┤
│  2. User adds that project to the Playground toolbox           │
├─────────────────────────────────────────────────────────────────┤
│  3. User asks Playground a prompt (e.g., "Sign in to Github")  │
├─────────────────────────────────────────────────────────────────┤
│  4. Playground checks toolbox & returns relevant script as tool │
├─────────────────────────────────────────────────────────────────┤
│  5. User clicks "Execute Tool" to run the script               │
├─────────────────────────────────────────────────────────────────┤
│  6. Script is passed to Chrome Extension & executes             │
└─────────────────────────────────────────────────────────────────┘
```

### Step-by-Step Process

#### 1. Prepare Playwright Scripts

- Record or write Playwright scripts for common browser automation tasks
- Store these scripts in a SEMOSS project

#### 2. Add Project to Playground Toolbox

- Open SEMOSS Playground
- Navigate to the toolbox settings
- Add your project containing the Playwright scripts

#### 3. Prompt Playground

- Open a Playground chat session
- Ask a question or give a command related to your automated tasks
- Example prompts:
  - "Sign in to Github"
  - "Can you fill out the login form?"
  - "Navigate to the user dashboard"

#### 4. Playground Returns Script Tool

- Playground searches the toolbox for relevant scripts
- Matches your prompt to the appropriate Playwright script
- Returns the script as an executable tool in the response
- You'll see the tool with an "Execute Tool" option

#### 5. Execute the Script

- Review the returned tool/script
- Click the **"Execute Tool"** button in the Playground response
- The script is automatically sent to the Chrome Extension

#### 6. Extension Runs the Script

- The extension receives the script from Playground
- Displays execution progress in the side panel (ensure it's open)
- Executes each Playwright action in sequence
- Shows real-time feedback and results
- Displays completion status when done

## Usage

## Prerequisites for Use

Before using the extension with Playground:

1. **Playwright Scripts Created** - Have scripts in a SEMOSS project
2. **Project Added to Toolbox** - Add your project to Playground toolbox
3. **Playground Access** - Open Playground in your browser

### Setting Up the Extension

1. **Install the Extension** (see [Installation](#installing-in-chrome))
2. **Ensure Extension is Active**
   - The extension icon should be visible in your toolbar
   - Pin it for easy access if needed

### Using with Playground

1. **Open Playground** in your browser
2. **Start a chat session, and add project from toolbox**
3. **Ask for automation** (e.g., "Sign in to Github")
4. **Open the Extension Side Panel** - Click the SEMOSS Chrome Extension icon in your toolbar
5. **Click "Execute Tool"** when Playground returns a script
6. **Watch the automation** run in the browser

Keep the extension side panel open to monitor execution progress in real-time.

### Monitoring Execution

**The side panel shows:**
- Current action being executed
- Completed actions (with checkmarks)
- Pending actions
- Error details for failed actions
- Overall script status

### Troubleshooting Failed Scripts

If a script fails to execute:

1. **Check the side panel** for specific error messages
2. **Verify the target page** is loaded and elements are visible
3. **Review selectors** - ensure they match the current page structure
4. **Check debugger** - ensure the yellow debugger banner appears
5. **Try manual execution** - test the steps manually to verify they work


## Troubleshooting

### Side Panel Not Opening

- Ensure you're using Chrome 114 or later (Side Panel API requirement)
- Check that the extension is enabled in `chrome://extensions/`
- Reload the extension after rebuilding
- Try clicking the extension icon again or using the right-click menu

### Automation Not Working

- Check that the debugger is attached (yellow banner appears at top of page)
- Ensure the script is in valid Playwright format
- Verify you clicked "Execute Tool" in Playground (not just viewing the script)
- Check that the extension has permission to access the current tab
- Look for error messages in the extension side panel
- Open Chrome DevTools Console (F12) for detailed error logs

### Extension Not Loading After Build

- Clear the Chrome extension cache: go to `chrome://extensions/`, remove the extension, then reload it
- Verify the `build/` folder contains all necessary files (manifest.json, assets, etc.)
- Check for build errors in the terminal output
- Ensure all dependencies are installed: `pnpm install`

### Script Execution Fails

- Verify the script JSON is properly formatted in your SEMOSS project
- Check that selectors in the script match elements on the target page
- Ensure the target website allows debugger attachment
- Some websites may block automation - check browser console for CSP or security errors
- Verify the page is fully loaded before script execution begins
- Check if dynamic content needs additional wait time

### Extension Not Receiving Scripts from Playground

- Verify the content script is loaded on the Playground page (check browser console)
- Check browser console for content script errors
- Ensure the project is properly added to Playground toolbox
- Verify the script format matches what Playground expects
- Reload both the Playground page and the extension
- Check that you're clicking "Execute Tool" and not just viewing the script

## Additional Documentation

For technical details about the extension's architecture, components, and development workflows, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Contributing

See [AGENTS.md](../../AGENTS.md) for development guidelines and conventions.

## License

See [LICENSE](../../LICENSE) for details.
