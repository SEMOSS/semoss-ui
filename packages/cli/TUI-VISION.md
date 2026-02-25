# SEMOSS CLI TUI - Interactive Mode Vision

## The Real Vision: Full-Screen Interactive CLI

### What We're Actually Building

Not just a collection of CLI commands, but a **persistent, interactive Terminal User Interface (TUI)** that developers live in while working with SEMOSS.

Think:
- **k9s** for Kubernetes
- **lazygit** for Git  
- **GitHub Copilot CLI** interactive mode
- **htop** for system monitoring

### The Interface

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SEMOSS CLI v1.0.0 | Instance: production (https://prod.semoss.com)      │
│ App: analytics-dashboard (APP123) | User: john@semoss.com | Connected ✓│
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  > MyInfo()                                                              │
│                                                                           │
│  {                                                                       │
│    "id": "user123",                                                     │
│    "name": "John Doe",                                                  │
│    "email": "john@semoss.com",                                         │
│    "admin": true                                                        │
│  }                                                                       │
│                                                                           │
│  ✓ Executed in 234ms                                                    │
│                                                                           │
│  > MyProjects()                                                          │
│                                                                           │
│  ┌─────────────────────────┬──────────┬────────────┐                   │
│  │ Name                    │ ID       │ Global     │                   │
│  ├─────────────────────────┼──────────┼────────────┤                   │
│  │ analytics-dashboard     │ APP123   │ Yes        │                   │
│  │ customer-insights       │ APP456   │ No         │                   │
│  └─────────────────────────┴──────────┴────────────┘                   │
│                                                                           │
│  ✓ Found 2 projects                                                     │
│                                                                           │
│                                                                           │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│ > _                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
 [Ctrl+C] Exit | [Tab] Autocomplete | [↑↓] History | [Ctrl+L] Clear
```

### Core Features

#### 1. **Persistent Header (Top Bar)**
Always visible context:
- CLI version
- Current instance (name + URL)
- Current app (name + ID)
- User info
- Connection status (✓ Connected / ✗ Disconnected / ⏳ Connecting)

#### 2. **Scrollable Output Area (Middle)**
Prettified display of:
- **Pixel command results** with syntax highlighting
- **JSON** formatted and color-coded
- **Tables** for structured data
- **Errors** highlighted in red with suggestions
- **Success messages** with timing info
- **Command history** showing what was run
- **File change notifications**

#### 3. **Input Prompt (Bottom)**
Interactive command entry:
- Runs Pixel commands directly
- Built-in commands (`:deploy`, `:switch`, `:status`, etc.)
- Command history (↑↓ arrows)
- Tab completion
- Multi-line editing for complex commands

#### 4. **Status Footer**
Keyboard shortcuts and help:
- `Ctrl+C` - Exit interactive mode
- `Tab` - Autocomplete
- `↑↓` - Command history
- `Ctrl+L` - Clear screen
- `Ctrl+W` - Toggle watch mode
- `?` - Show help

### Commands in Interactive Mode

#### Pixel Commands (Direct Execution)
```
> MyInfo()
> MyProjects()
> CreateProject("new-app")
> 1 + 1
> META | Frame()
```

Output is automatically prettified based on response type.

#### Built-in Commands (Prefixed with `:`)
```
:deploy              # Deploy current app
:watch               # Start file watcher (auto-deploy on change)
:unwatch             # Stop file watcher
:switch <instance>   # Switch instance
:link <app-id>       # Link to different app
:status              # Show current configuration
:apps                # List available apps
:clear               # Clear output
:help                # Show all commands
:exit                # Exit (or Ctrl+C)
```

#### File Watcher
```
> :watch
✓ Watching for file changes...

  📝 src/index.ts changed
  ⏳ Deploying...
  ✓ Deployed successfully (1.2s)

  📝 src/components/Chart.tsx changed
  ⏳ Deploying...
  ✓ Deployed successfully (0.8s)
```

### Technical Implementation

#### Libraries Needed

**For TUI Framework:**
- `ink` (React for CLIs - by Vercel, modern and actively maintained)
  - Or `blessed` (more mature but heavier)
  - Or `blessed-contrib` (blessed with widgets)

**For Pretty Output:**
- `chalk` ✓ (already have)
- `cli-table3` ✓ (already have)
- `json-colorizer` or `cardinal` - Syntax highlighting for JSON
- `strip-ansi` - Clean ANSI codes when needed

**For Interactive Features:**
- `inquirer` ✓ (already have)
- `autocomplete-prompt` - Tab completion
- `node-pty` - Terminal emulation (if needed)

**For File Watching:**
- `chokidar` - File system watcher
- `debounce` - Prevent too many deployments

**For History:**
- `node-persist` - Store command history locally

#### Architecture

```
packages/cli/
├── src/
│   ├── commands/
│   │   ├── interactive.ts    # NEW: Launch TUI mode
│   │   ├── connect.ts        # Existing
│   │   ├── deploy.ts         # Existing
│   │   └── ...
│   ├── tui/                  # NEW: TUI components
│   │   ├── components/
│   │   │   ├── Header.tsx    # Top bar
│   │   │   ├── Output.tsx    # Scrollable output
│   │   │   ├── Input.tsx     # Command prompt
│   │   │   ├── Footer.tsx    # Help bar
│   │   │   └── App.tsx       # Main TUI app
│   │   ├── formatters/
│   │   │   ├── json.ts       # Prettify JSON
│   │   │   ├── table.ts      # Format tables
│   │   │   ├── error.ts      # Format errors
│   │   │   └── success.ts    # Format success
│   │   ├── watcher.ts        # File watcher
│   │   ├── executor.ts       # Pixel command executor
│   │   ├── history.ts        # Command history
│   │   └── state.ts          # TUI state management
│   ├── utils/
│   │   ├── config.ts         # Existing
│   │   ├── banner.ts         # Existing
│   │   └── errors.ts         # Existing
│   └── ...
```

### User Workflows

#### Workflow 1: Start Interactive Session
```bash
# Launch TUI
semoss

# Or with specific instance
semoss --instance production

# Or start in specific app
semoss --app APP123
```

The TUI takes over, showing header with context.

#### Workflow 2: Run Pixel Commands
```
> MyInfo()
# See prettified JSON output

> MyProjects()
# See table of projects

> META | Frame()
# See frame data formatted
```

#### Workflow 3: Development with Auto-Deploy
```
> :watch
# File watcher starts

# Edit files in your editor
# CLI shows each change and deploys automatically

> :unwatch
# Stop watching
```

#### Workflow 4: Switch Context
```
> :status
# See current instance and app

> :switch staging
# Switch to staging instance

> :apps
# List apps in staging

> :link APP789
# Link to different app

> :deploy
# Deploy to new context
```

### Progressive Enhancement

#### Phase 1: Basic TUI (MVP)
- [ ] Header with instance/app info
- [ ] Output area with basic formatting
- [ ] Input prompt for Pixel commands
- [ ] Execute Pixel and display results
- [ ] Built-in commands (`:deploy`, `:status`, etc.)
- [ ] Exit with Ctrl+C

#### Phase 2: Enhanced Display
- [ ] JSON syntax highlighting
- [ ] Table formatting for structured data
- [ ] Error highlighting with suggestions
- [ ] Command history (↑↓)
- [ ] Scrollable output
- [ ] Clear command

#### Phase 3: File Watching
- [ ] `:watch` command
- [ ] File change detection
- [ ] Auto-deploy on change
- [ ] Show deployment progress
- [ ] Debounced deployments

#### Phase 4: Advanced Features
- [ ] Tab completion for Pixel commands
- [ ] Multi-line command editing
- [ ] Save/load sessions
- [ ] Export output to file
- [ ] Search history
- [ ] Keyboard shortcuts customization

### Entry Point

```bash
# Traditional CLI mode (current)
semoss deploy
semoss connect
semoss status

# Interactive TUI mode (new)
semoss              # No command = launch TUI
semoss interactive  # Explicit
semoss -i           # Short form
```

### Benefits

1. **Faster Development Cycle**
   - No need to run `semoss deploy` repeatedly
   - Auto-deploy watches files
   - Instant feedback

2. **Better Context**
   - Always see what instance/app you're in
   - Can't accidentally deploy to wrong place
   - Clear visual state

3. **Experimentation**
   - Run Pixel commands interactively
   - See results immediately
   - Learn by doing

4. **Professional Experience**
   - Modern, polished interface
   - Like tools developers already love (k9s, lazygit)
   - Makes SEMOSS development feel cutting-edge

### Comparison: Current vs Vision

| Feature | Current CLI | Interactive TUI |
|---------|-------------|-----------------|
| Mode | One-shot commands | Persistent session |
| Context | Shown per command | Always visible |
| Commands | CLI commands only | Pixel + CLI commands |
| Feedback | After command | Real-time |
| Auto-deploy | Manual | File watcher |
| Output | Plain text | Prettified/colored |
| History | Shell history | Built-in with search |
| Learning curve | Read docs | Interactive + discoverable |

## Next Steps

Would you like me to:

1. **Build the MVP TUI** (Phase 1) with basic interactive mode?
2. **Spike with `ink`** to prove the concept?
3. **Update the architecture** to support both CLI and TUI modes?
4. **Create a prototype** to validate the UX?

This is a much bigger vision than individual commands - it's a complete development environment. Exciting! 🚀
