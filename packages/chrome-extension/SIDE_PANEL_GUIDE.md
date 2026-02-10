# Side Panel Migration Guide

## What Changed?

The Workshop Automation Assistant extension is now available as a **persistent side panel** in Chrome! This means you no longer need to open DevTools to use the extension.

## Benefits

✅ **Always Accessible**: Click the extension icon to open the panel instantly  
✅ **Persistent**: The panel stays open across tabs and browser navigation  
✅ **Better UX**: Larger, resizable panel for easier interaction  
✅ **Multi-tasking**: Use the extension while keeping DevTools available for other debugging

## How to Use

### Opening the Side Panel

**Method 1: Extension Icon (Recommended)**
1. Look for the Workshop Automation Assistant icon in your Chrome toolbar (top-right)
2. Click the icon
3. The side panel will slide in from the right

**Method 2: Right-click Menu**
1. Right-click the extension icon
2. Select "Open side panel"

**Method 3: Keyboard Shortcut** (can be configured in Chrome)
1. Go to `chrome://extensions/shortcuts`
2. Find "Workshop Automation Assistant"
3. Set a custom keyboard shortcut

### Using the Panel

The side panel works exactly like the DevTools version:
- **LLM Mode**: Type natural language commands
- **Script Mode**: Load and execute automation scripts
- **Playground Integration**: Auto-execute from Playground chat
- **Settings**: Configure your Workshop API credentials

### Closing the Panel

- Click the × button at the top of the panel
- Click the extension icon again (toggles visibility)
- Press Escape key while focused on the panel

### Resizing the Panel

- Hover over the left edge of the panel
- Click and drag to adjust the width
- Your preferred size is remembered

## DevTools Panel Still Available

The extension still works in DevTools if you prefer:
1. Press F12 to open Chrome DevTools
2. Navigate to the "Workshop AI" tab
3. Same functionality in a different location

## Minimum Chrome Version

The Side Panel API requires **Chrome 114 or later**. If you're on an older version:
- Update Chrome to the latest version
- Or continue using the DevTools panel

## Troubleshooting

### Icon Not Visible?
- Check that the extension is enabled at `chrome://extensions/`
- Look in the extensions overflow menu (puzzle piece icon)
- Pin the extension to make it always visible

### Panel Won't Open?
- Update Chrome to version 114+
- Reload the extension: `chrome://extensions/` → Click reload button
- Check browser console for errors

### Need Help?
- Check the [README.md](./README.md) for detailed documentation
- Review [PLAYGROUND_INTEGRATION.md](./PLAYGROUND_INTEGRATION.md) for integration features

## For Developers

### Building with Side Panel Support

The extension now includes:
```json
{
  "permissions": ["sidePanel"],
  "side_panel": {
    "default_path": "panel.html"
  },
  "action": {
    "default_title": "Workshop Automation Assistant"
  }
}
```

The background service worker handles opening:
```typescript
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});
```

No changes needed to the panel React code - it works in both contexts!
