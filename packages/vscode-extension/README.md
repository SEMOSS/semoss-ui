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

## MCP Server Configuration

### Overview
The Model Context Protocol (MCP) allows the chatbot to connect to external tools and services. You can configure MCP servers in the `config/semoss-config.yaml` file under the `mcpServers` array.

### Accessing MCP Manager
Open the MCP Manager through:
- **Chatbot Settings**: Click the gear icon in the chatbot, then navigate to the "MCP Servers" tab
- **Command Palette**: Type "Semoss: Open Chatbot" and access settings

### Configuration Structure
Each MCP server in the configuration has the following properties:

```yaml
mcpServers:
  - name: ServerName              # Unique identifier for the server
    command: npx                  # Command to execute (npx, node, python, etc.)
    args: []                      # Command arguments (optional)
    timeout: 15000                # Timeout in milliseconds (optional, server-level)
    enabled: true                 # Whether the server is active
    url: http://...               # URL for HTTP-based servers (optional)
    method: POST                  # HTTP method (optional)
    headers:                      # HTTP headers (optional)
      Content-Type: application/json
      Authorization: Bearer token
    tools: []                     # Array of tools this server provides
```

### Example 1: Standard NPX-based MCP Server

This example shows a git server using the official ModelContextProtocol package:

```yaml
mcpServers:
  - name: git
    command: npx
    args:
      - '@modelcontextprotocol/server-git'
    timeout: 5000
    enabled: true
    tools: []
```

**Important for Windows**: If you encounter "spawn npx ENOENT" errors, use the full path:

```yaml
mcpServers:
  - name: git
    command: "C:\\Program Files\\nodejs\\npx.cmd"
    args:
      - '@modelcontextprotocol/server-git'
    timeout: 5000
    enabled: true
    tools: []
```

### Example 2: HTTP-based Semoss Tool

This example shows a Date tool that connects to a Semoss platform API:

```yaml
mcpServers:
  - name: Date
    command: npx
    args: []
    timeout: 15000
    enabled: true
    url: http://localhost:9090/Monolith/api/ext/mcp/your-id/comms
    method: POST
    headers:
      Content-Type: application/json
      Authorization: Bearer your-token-here
    tools:
      - name: Date
        command: semoss_npx
        description: Get current date and time from your Semoss platform
        parameters:
          type: object
          properties:
            format:
              type: string
              description: Date format (e.g., 'DD-MM-YYYY', 'YYYY-MM-DD')
            date:
              type: string
              description: Date string (e.g., '2023-03-15')
          required: []
```

**Key Components:**
- `command: semoss_npx` - Special identifier for HTTP-based Semoss tools
- `url` - API endpoint for the tool (server-level)
- `method` - HTTP method (server-level)
- `headers` - Authorization and content type (server-level)
- `parameters` - JSON schema defining the tool's input parameters

### Adding Custom MCP Servers via UI

1. Open the chatbot and click the settings gear icon
2. Navigate to the "MCP Servers" tab
3. Click "+ Add Custom Server"
4. Fill in the form:
   - **Server Name**: Unique identifier (e.g., "filesystem", "docker")
   - **Command**: Executable command (e.g., "npx", "python", "docker")
   - **Arguments**: Space-separated arguments
   - **Description**: Brief description of the server's purpose
   - **Timeout**: Maximum execution time in milliseconds (server-level)
   - **URL**: API endpoint for HTTP-based servers (optional)
   - **Method**: HTTP method - GET, POST, PUT, or DELETE (optional)
   - **HTTP Headers**: Add key-value pairs for authentication and content type (optional)
   - **Tools Configuration**: Define at least one tool with:
     - Tool Name
     - Command to execute
     - Description
     - Parameters (Optional JSON schema for tool inputs)

5. Click "Add Server" to save

### Managing MCP Servers

**Enable/Disable Servers**: 
- Toggle the ON/OFF button on each server card
- Disabled servers won't be loaded or accessible to the chatbot

**Edit Servers**:
- Click the ✏️ (edit) button to modify server configuration
- Update any fields and click "Update Server"

**Delete Servers**:
- Click the 🗑️ (delete) button
- Confirm deletion in the popup dialog

### Troubleshooting

**"spawn npx ENOENT" Error**:
- Use full path to npx.cmd on Windows: `"C:\\Program Files\\nodejs\\npx.cmd"`
- Verify Node.js is installed and in your PATH

**Tool Not Responding**:
- Check the `timeout` value (increase if needed)
- Verify the `url` is accessible
- Ensure `Authorization` headers contain valid tokens

**Server Not Showing Tools**:
- Confirm `enabled: true` is set
- Verify tools array is properly configured
- Check the chatbot console for error messages

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