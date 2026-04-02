# Semoss VSCode Plugin

This VSCode extension is used for creating zip and deploying the assets folder for Semoss applications. It now features a modern React-based chatbot interface for enhanced user assistance.

## Features

This VSCode extension is used for creating zip and deploying the assets folder for Semoss applications.

You can right click on the portals, client or py folder in VSCode to zip, deploy or "zip and deploy" applications to your own instance of Semoss.

### Modern Chatbot Interface 🤖

The extension includes a sophisticated chatbot built with React that provides:
- **Interactive Assistance**: Get help with Semoss operations and commands
- **Modern UI**: React-based interface with responsive design
- **VS Code Integration**: Seamlessly integrated with VS Code's webview system
- **Mobile-Friendly**: Optimized for various screen sizes
- **Accessibility**: ARIA labels and keyboard navigation support

Access the chatbot through:
- Activity Bar: Click the Semoss Assistant icon
- Command Palette: "Semoss: Open Chatbot"

### Instance Management

The extension now supports multiple Semoss instances with aliases:
- **Authorize New Instance**: Add a new Semoss instance with a custom alias
- **Select Instance**: Switch between saved instances
- **Remove Instance**: Delete saved instances

## Process

### First Time Setup
- In the command prompt (CTRL/COMMAND + SHIFT + P), search for "Semoss: Authorize New Instance"
- Enter an alias for your instance (e.g., "Production", "Development", "Staging")
- Generate an access and a private key from the Semoss instance. You can do that from Settings -> My Profile -> Generate
- Enter the URL that you want to authorize. For e.g., if you want to authenticate "https://workshop.cfg.deloitte.com/cfg-ai-demo/SemossWeb/packages/client/dist/#/", then pass the URL parameter as https://workshop.cfg.deloitte.com/cfg-ai-demo. Remember not to have the last /
- Enter the access and private key that you generated as the next parameters

### Using Multiple Instances
- Use "Semoss: Select Instance" to switch between your saved instances
- The extension will remember your instances across VS Code sessions
- Use "Semoss: Remove Instance" to delete instances you no longer need

### Deployment
- You can right click on client, py or portal folder to zip, deploy or zip and deploy the asset
- The extension will use your currently selected instance for deployment

## Available Commands

- **Semoss: Authorize New Instance** - Add a new Semoss instance
- **Semoss: Select Instance** - Switch between saved instances  
- **Semoss: Remove Instance** - Delete a saved instance
- **Semoss: Open Chatbot** - Open the interactive chatbot assistant
- **Semoss: Zip and Deploy** - Zip project files and deploy to current instance
- **Semoss: Zip Only** - Only create a zip file of the project
- **Semoss: Deploy Only** - Deploy existing zip file to current instance

## Architecture

### React Chatbot
The chatbot is built using modern React architecture:
- **Components**: Modular React components for maintainability
- **Hooks**: Custom hooks for state management and VS Code API integration
- **Vite**: Fast build system with hot module replacement
- **CSS Modules**: Scoped styling with CSS variables

<!-- For detailed migration information, see REACT_MIGRATION.md. -->

## Development

### Building the Extension
```bash
npm run build            # Build webview + extension bundle
npm run esbuild          # Build extension only (with sourcemap)
npm run esbuild-watch    # Watch mode for extension code
npm run build-chatbot    # Build only the React webview
npm run typecheck        # Type-only check (no emit)
npm run lint             # Basic lint stub (alerts / TODOs)
```

### React Chatbot Development
```bash
cd src/webviews/chatbot-react
npm install
npm run dev  # Development with HMR
npm run build  # Production build
```

### Configuration (YAML) Editor
The Settings panel now includes a YAML configuration editor that persists to `config/semoss-config.yaml` inside the extension root.

Workflow:
1. Open the chatbot view
2. Open settings (gear / or Command Palette: `Semoss: Open Chatbot` then settings)
3. Edit YAML in the Configuration tab
4. Click "Save Configuration" — a status banner (info → success or error) appears

Status Indicators:
- `Saving configuration...` (info)
- `Configuration saved.` (success, auto-dismisses)
- Descriptive error messages if validation or file write fails

Resetting: Click "Reset to Defaults" to load a default template in the editor (not saved until you click Save).

Validation: Basic structural validation occurs (e.g., at least one model). Warnings are logged to the dev console; hard errors prevent saving.

Environment Variables: Use placeholders like `$OPENAI_API_KEY` in model definitions; you can substitute them at runtime in your own logic.

### Message Protocol (Extension <-> Webview)
| Message | Direction | Purpose |
|---------|-----------|---------|
| `getConfig` | Webview → Extension | Request current config |
| `configData` | Extension → Webview | Respond with YAML string |
| `saveConfig` | Webview → Extension | Persist updated config object |
| `configSaved` | Extension → Webview | Acknowledge success/failure `{success:boolean}` |
| `configError` | Extension → Webview | Error while saving `{error:string}` |

### Production Hardening
- Non-blocking status UI instead of `alert()` (webview sandbox disallows modal dialogs)
- Case-insensitive publisher lookup ensures config path resolution
- Auto-create `config/` directory if missing
- Build script guarantees packaged assets are current

## Release Notes

### 2.0.0 (React Migration)
- **NEW**: Modern React-based chatbot interface
- **IMPROVED**: Better performance with virtual DOM
- **ENHANCED**: Mobile-responsive design
- **ADDED**: Accessibility features (ARIA labels, keyboard navigation)
- **OPTIMIZED**: Bundle size reduced from 1.5MB to 156KB
- **MODERNIZED**: ES6+ modules with Vite build system

### 1.1.0
- Added support for multiple instances with aliases
- Improved instance management with select and remove functionality
- Better error handling and user feedback
- Automatic migration from old single-instance storage

### 1.0.0

- Initial release of Semoss VSCode plugin
- Provide a way to zip folders
- Authenticate for a Semoss instance and deploy code

## Upcoming Updates

- React Testing Library integration for component testing
- Enhanced chatbot features with context-aware assistance
- PWA capabilities for offline functionality
- Advanced deployment workflows with multiple environment support