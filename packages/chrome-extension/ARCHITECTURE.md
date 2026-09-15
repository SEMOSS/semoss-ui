# SEMOSS Chrome Extension - Architecture & Development

This document provides technical details about the extension's architecture, project structure, and development workflows.

## Architecture

### Components

- **Background Service Worker** (`src/background/`)
  - Handles debugger attachment
  - Executes browser automation actions
  - Manages side panel opening
  - Listens for script execution requests from Playground

- **Content Script** (`src/content/`)
  - Monitors Playground pages for user interactions
  - Detects "Execute Tool" button clicks
  - Forwards script data to background worker
  - Enables communication between Playground and extension

- **Side Panel** (`src/panel/`)
  - Main UI for the extension
  - React-based interface
  - Displays script execution progress
  - Shows real-time action feedback and status

- **DevTools Panel** (`src/devtools/`)
  - Alternative access point
  - Same functionality as side panel

### Build System

- **Vite**: Fast build tool and bundler (configured via `vite.config.ts`)
- **TypeScript**: Type-safe development
- **React**: UI framework
- **@crxjs/vite-plugin**: Chrome extension support for Vite
- **pnpm**: Fast, disk space efficient package manager

## Development

### Project Structure

```
src/
  ├── assets/           # Extension icons and images
  ├── background/       # Service worker (background tasks)
  ├── content/          # Content script (monitors Playground interactions)
  ├── devtools/         # DevTools panel registration
  ├── panel/            # Main UI (React app for side panel)
  ├── services/         # API services and script execution logic
  └── manifest.json     # Extension configuration
```


### Key Technologies

- Chrome Extension Manifest V3
- Chrome Side Panel API
- Chrome Debugger API
- React 18
- TypeScript 5
- Vite 6
- @crxjs/vite-plugin

## Technical Details

### Communication Flow

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Playground │────────▶│   Content   │────────▶│ Background  │
│    Page     │         │   Script    │         │   Worker    │
└─────────────┘         └─────────────┘         └─────────────┘
                                                        │
                                                        │
                                                        ▼
                                                 ┌─────────────┐
                                                 │   Chrome    │
                                                 │  Debugger   │
                                                 └─────────────┘
                                                        │
                                                        │
                                                        ▼
                                                 ┌─────────────┐
                                                 │  Target     │
                                                 │  Web Page   │
                                                 └─────────────┘
```

### Extension Lifecycle

1. **Installation**: Extension loads and registers components
2. **Content Script Injection**: Monitors Playground pages
3. **User Interaction**: User clicks "Execute Tool" in Playground
4. **Message Passing**: Content script sends script data to background worker
5. **Debugger Attachment**: Background worker attaches debugger to active tab
6. **Script Execution**: Background worker executes Playwright actions via debugger
7. **Progress Updates**: Side panel displays real-time execution status

### Development Workflow

1. Make code changes in `src/`
3. Test in Chrome using "Load unpacked"
4. Debug using Chrome DevTools
5. Build for production with `pnpm run build`
6. Update version in `manifest.json`
7. Reload extension in Chrome

### Testing

- Manual testing via "Load unpacked" in Chrome
- Test with actual Playground integration
- Verify script execution on target websites
- Check side panel UI updates
- Verify content script communication

## Contributing

When contributing to the extension:

1. Follow the project's code style (enforced by Biome)
2. Test all changes with actual Playground integration
3. Update documentation for architectural changes
4. Ensure backward compatibility with existing scripts

See [AGENTS.md](../../AGENTS.md) for general development guidelines and conventions.

## Permissions

The extension requires the following permissions:

- `tabs` - Access tab information
- `activeTab` - Interact with the active tab
- `storage` - Store extension state and preferences
- `debugger` - Execute automation actions via Chrome Debugger Protocol
- `scripting` - Inject content scripts to monitor Playground
- `sidePanel` - Display persistent side panel for execution monitoring
- `host_permissions` - Access to http:// and https:// for automation
