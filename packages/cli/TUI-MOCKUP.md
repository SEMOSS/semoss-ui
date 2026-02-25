# SEMOSS CLI TUI - Visual Mockups

## 1. Initial Launch / Connected State

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║ SEMOSS CLI v1.0.0-beta.15                                                     ║
║ Instance: production (https://prod.semoss.com)                               ║
║ App: analytics-dashboard (APP123)                                            ║
║ User: john@semoss.com | Status: Connected ✓                                  ║
╚═══════════════════════════════════════════════════════════════════════════════╝

  Welcome to SEMOSS Interactive CLI! 🚀

  You are connected to: production
  Current app: analytics-dashboard (APP123)

  Type a Pixel command to execute, or try:
    • :help      Show all commands
    • :status    Show current configuration
    • :apps      List available apps
    • :deploy    Deploy current app

  Examples:
    > MyInfo()
    > MyProjects()
    > 1 + 1


────────────────────────────────────────────────────────────────────────────────
> _
────────────────────────────────────────────────────────────────────────────────
 [Ctrl+C] Exit | [↑↓] History | [Ctrl+L] Clear | [?] Help
```

## 2. Executing a Pixel Command - MyInfo()

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║ SEMOSS CLI v1.0.0-beta.15                                                     ║
║ Instance: production (https://prod.semoss.com)                               ║
║ App: analytics-dashboard (APP123)                                            ║
║ User: john@semoss.com | Status: Connected ✓                                  ║
╚═══════════════════════════════════════════════════════════════════════════════╝

  > MyInfo()

  ⏳ Executing...

  ────────────────────────────────────────────────────────────────────────────

  Result:

  {
    "id": "user_abc123",
    "name": "John Doe",
    "email": "john@semoss.com",
    "admin": true,
    "type": "NATIVE"
  }

  ────────────────────────────────────────────────────────────────────────────
  ✓ Executed successfully in 234ms


────────────────────────────────────────────────────────────────────────────────
> _
────────────────────────────────────────────────────────────────────────────────
 [Ctrl+C] Exit | [↑↓] History | [Ctrl+L] Clear | [?] Help
```

## 3. Executing MyProjects() - Table Output

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║ SEMOSS CLI v1.0.0-beta.15                                                     ║
║ Instance: production (https://prod.semoss.com)                               ║
║ App: analytics-dashboard (APP123)                                            ║
║ User: john@semoss.com | Status: Connected ✓                                  ║
╚═══════════════════════════════════════════════════════════════════════════════╝

  > MyInfo()
  ✓ Executed successfully in 234ms

  > MyProjects()

  ⏳ Executing...

  ────────────────────────────────────────────────────────────────────────────

  Result: Found 3 projects

  ┌─────────────────────────────────┬────────────┬──────────┬──────────────┐
  │ Project Name                    │ Project ID │ Global   │ Discoverable │
  ├─────────────────────────────────┼────────────┼──────────┼──────────────┤
  │ analytics-dashboard             │ APP123     │ Yes      │ Yes          │
  │ customer-insights               │ APP456     │ No       │ No           │
  │ sales-reporting                 │ APP789     │ Yes      │ Yes          │
  └─────────────────────────────────┴────────────┴──────────┴──────────────┘

  ────────────────────────────────────────────────────────────────────────────
  ✓ Executed successfully in 456ms


────────────────────────────────────────────────────────────────────────────────
> _
────────────────────────────────────────────────────────────────────────────────
 [Ctrl+C] Exit | [↑↓] History | [Ctrl+L] Clear | [?] Help
```

## 4. Error Scenario - Connection Failed

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║ SEMOSS CLI v1.0.0-beta.15                                                     ║
║ Instance: production (https://prod.semoss.com)                               ║
║ App: analytics-dashboard (APP123)                                            ║
║ User: john@semoss.com | Status: Disconnected ✗                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝

  > MyProjects()
  ✓ Executed successfully in 456ms

  > CreateProject("new-app")

  ⏳ Executing...

  ────────────────────────────────────────────────────────────────────────────

  ✗ Error: Connection timeout

  💡 Suggestions:
     • Check that the server is responding
     • Verify network connectivity
     • Try again in a moment

  ────────────────────────────────────────────────────────────────────────────
  ✗ Failed after 30s


────────────────────────────────────────────────────────────────────────────────
> _
────────────────────────────────────────────────────────────────────────────────
 [Ctrl+C] Exit | [↑↓] History | [Ctrl+L] Clear | [?] Help
```

## 5. Using Built-in Commands - :deploy

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║ SEMOSS CLI v1.0.0-beta.15                                                     ║
║ Instance: production (https://prod.semoss.com)                               ║
║ App: analytics-dashboard (APP123)                                            ║
║ User: john@semoss.com | Status: Connected ✓                                  ║
╚═══════════════════════════════════════════════════════════════════════════════╝

  > CreateProject("new-app")
  ✗ Failed after 30s

  > :deploy

  🚀 Deploying analytics-dashboard to production...

  ────────────────────────────────────────────────────────────────────────────

  [1/5] Initializing connection...                              ✓ Done (0.2s)
  [2/5] Zipping current directory...                            ✓ Done (1.4s)
  [3/5] Deleting old assets...                                  ✓ Done (0.5s)
  [4/5] Uploading assets (2.4 MB)...                            ✓ Done (3.2s)
  [5/5] Publishing app...                                       ✓ Done (0.8s)

  ────────────────────────────────────────────────────────────────────────────
  ✓ Deployment completed successfully in 6.1s

  🔗 App URL: https://prod.semoss.com/app/APP123


────────────────────────────────────────────────────────────────────────────────
> _
────────────────────────────────────────────────────────────────────────────────
 [Ctrl+C] Exit | [↑↓] History | [Ctrl+L] Clear | [?] Help
```

## 6. Using :help Command

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║ SEMOSS CLI v1.0.0-beta.15                                                     ║
║ Instance: production (https://prod.semoss.com)                               ║
║ App: analytics-dashboard (APP123)                                            ║
║ User: john@semoss.com | Status: Connected ✓                                  ║
╚═══════════════════════════════════════════════════════════════════════════════╝

  > :help

  ────────────────────────────────────────────────────────────────────────────

  Built-in Commands:

  Configuration:
    :status                  Show current configuration
    :switch <instance>       Switch to a different instance
    :link <app-id>           Link to a different app
    :apps                    List all available apps

  Deployment:
    :deploy                  Deploy current app to current instance

  Interface:
    :clear                   Clear the output screen
    :help                    Show this help message
    :exit                    Exit interactive mode (or press Ctrl+C)

  Pixel Commands:
    Type any Pixel command directly (without :prefix)
    Examples:
      MyInfo()
      MyProjects()
      CreateProject("app-name")
      1 + 1
      META | Frame()

  ────────────────────────────────────────────────────────────────────────────


────────────────────────────────────────────────────────────────────────────────
> _
────────────────────────────────────────────────────────────────────────────────
 [Ctrl+C] Exit | [↑↓] History | [Ctrl+L] Clear | [?] Help
```

## 7. Switching Instance with :switch

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║ SEMOSS CLI v1.0.0-beta.15                                                     ║
║ Instance: production (https://prod.semoss.com)                               ║
║ App: analytics-dashboard (APP123)                                            ║
║ User: john@semoss.com | Status: Connected ✓                                  ║
╚═══════════════════════════════════════════════════════════════════════════════╝

  > :switch staging

  🔄 Switching instance from production to staging...

  ────────────────────────────────────────────────────────────────────────────

  Disconnecting from production...                              ✓ Done
  Connecting to staging (https://staging.semoss.com)...         ✓ Done
  Authenticating...                                             ✓ Done

  ────────────────────────────────────────────────────────────────────────────
  ✓ Successfully switched to staging

  ⚠️  Note: Current app link (APP123) may not exist in staging.
     Use :apps to see available apps in this instance.

╔═══════════════════════════════════════════════════════════════════════════════╗
║ SEMOSS CLI v1.0.0-beta.15                                                     ║
║ Instance: staging (https://staging.semoss.com)                               ║
║ App: analytics-dashboard (APP123)                                            ║
║ User: john@semoss.com | Status: Connected ✓                                  ║
╚═══════════════════════════════════════════════════════════════════════════════╝

────────────────────────────────────────────────────────────────────────────────
> _
────────────────────────────────────────────────────────────────────────────────
 [Ctrl+C] Exit | [↑↓] History | [Ctrl+L] Clear | [?] Help
```

## 8. Not Connected State

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║ SEMOSS CLI v1.0.0-beta.15                                                     ║
║ Instance: Not Connected                                                       ║
║ App: Not Linked                                                               ║
║ Status: Disconnected ✗                                                        ║
╚═══════════════════════════════════════════════════════════════════════════════╝

  ⚠️  You are not connected to any SEMOSS instance.

  To get started, exit this session and run:
    semoss connect      Add a new instance
    semoss setup        Run the setup wizard

  Or type :exit to quit.


────────────────────────────────────────────────────────────────────────────────
> _
────────────────────────────────────────────────────────────────────────────────
 [Ctrl+C] Exit | [↑↓] History | [Ctrl+L] Clear | [?] Help
```

## 9. Scrollable Output (Many Commands)

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║ SEMOSS CLI v1.0.0-beta.15                                                     ║
║ Instance: production (https://prod.semoss.com)                               ║
║ App: analytics-dashboard (APP123)                                            ║
║ User: john@semoss.com | Status: Connected ✓                                  ║
╚═══════════════════════════════════════════════════════════════════════════════╝
                                                                         ▲ Scroll
  > 1 + 1
  Result: 2
  ✓ Executed successfully in 123ms

  > MyInfo()
  Result: { "id": "user_abc123", "name": "John Doe", ... }
  ✓ Executed successfully in 234ms

  > MyProjects()
  Result: Found 3 projects
  [Table output...]
  ✓ Executed successfully in 456ms

  > CreateProject("test-app")
  Result: { "project_id": "APP999" }
  ✓ Executed successfully in 678ms

  > :deploy
  [Deployment progress...]
  ✓ Deployment completed successfully in 6.1s
                                                                         ▼ More
────────────────────────────────────────────────────────────────────────────────
> _
────────────────────────────────────────────────────────────────────────────────
 [Ctrl+C] Exit | [↑↓] History | [Ctrl+L] Clear | [?] Help
```

## Key Visual Elements

### Color Scheme
- **Header**: Cyan background, white text
- **Instance/App**: Bright colors for visibility
- **Success (✓)**: Green
- **Error (✗)**: Red
- **Warning (⚠️)**: Yellow
- **Loading (⏳)**: Cyan
- **JSON keys**: Cyan
- **JSON values**: White/Green depending on type
- **Tables**: Cyan headers, white data

### Status Indicators
- **✓** Connected / Success
- **✗** Disconnected / Error
- **⏳** Loading / In Progress
- **🚀** Deploying
- **🔄** Switching
- **⚠️** Warning
- **💡** Suggestion
- **🔗** Link/URL

### Layout
- **Fixed Header**: 4 lines, always visible
- **Scrollable Content**: Expands to fill terminal height
- **Fixed Input**: 1 line, always visible at bottom
- **Fixed Footer**: 1 line, keyboard shortcuts

This is what it will look and feel like! Thoughts?
