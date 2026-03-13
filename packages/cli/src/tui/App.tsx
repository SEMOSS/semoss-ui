import { Box, useApp, useInput, useStdout } from "ink";
import type React from "react";
import { useEffect, useState } from "react";
import { execSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { InstanceConfig } from "../types.js";
import { loadCredentials, saveCredentials } from "../utils/config.js";
import { Footer } from "./components/Footer.js";
import { Header } from "./components/Header.js";
import { Input } from "./components/Input.js";
import { Output, type OutputEntry } from "./components/Output.js";
import { SnakeGame } from "./components/SnakeGame.js";
import { useCommandHistory } from "./hooks/useCommandHistory.js";
import { DEFAULT_THEME, getTheme, getThemeNames } from "./themes.js";
import {
	createSession,
	destroySession,
	executePixelCommand,
	formatOutput,
} from "./utils/pixel.js";

export const App: React.FC = () => {
	const { exit } = useApp();
	const { stdout } = useStdout();
	const commandHistory = useCommandHistory();
	const [entries, setEntries] = useState<OutputEntry[]>([]);
	const [instanceName, setInstanceName] = useState<string | undefined>();
	const [instance, setInstance] = useState<InstanceConfig | undefined>();
	const [currentApp, setCurrentApp] = useState<{
		id: string;
		name?: string;
	}>();
	const [connected, setConnected] = useState(false);
	const [user, setUser] = useState<string | undefined>();
	const [loading, setLoading] = useState(false);
	const [gitBranch, setGitBranch] = useState<string | undefined>();
	const [konamiIndex, setKonamiIndex] = useState(0);
	const [gameMode, setGameMode] = useState<"snake" | null>(null);
	const [themeName, setThemeName] = useState<string>(DEFAULT_THEME);
	const [pendingAction, setPendingAction] = useState<{
		type: "deploy";
		args: string[];
		flags: string[];
		dryRun: boolean;
		targets: string[];
	} | null>(null);
	const [pendingCreateAction, setPendingCreateAction] = useState<{
		step: "name" | "allInstances";
		args: string[];
	} | null>(null);

	/** Get current git branch if in a git repository */
	const getGitBranch = (): string | undefined => {
		try {
			const branch = execSync("git rev-parse --abbrev-ref HEAD", {
				encoding: "utf-8",
				stdio: ["pipe", "pipe", "pipe"],
			}).trim();
			return branch || undefined;
		} catch {
			// Not a git repo or git not available
			return undefined;
		}
	};

	// Load initial state and clean up the SDK session on unmount.
	useEffect(() => {
		loadInitialState();
		setGitBranch(getGitBranch());
		return () => {
			destroySession();
		};
	}, []);

	const loadInitialState = async () => {
		try {
			const credentials = loadCredentials();
			const currentName = credentials.currentInstance;

			if (currentName && credentials.instances[currentName]) {
				const current = credentials.instances[currentName];
				setInstanceName(currentName);
				setInstance(current);

				// Create a reusable SDK session and fetch user info
				const session = await createSession({
					module: current.module,
					accessKey: current.accessKey,
					secretKey: current.secretKey,
				});

				if (session.success) {
					setConnected(true);
					if (session.user) {
						setUser(session.user.name ?? session.user.id);
					}
				} else {
					addEntry({
						type: "error",
						content: `Connection failed: ${session.error}`,
					});
				}

				// Check if there's a linked app
				if (current.apps) {
					const apps = Object.values(current.apps);
					if (apps.length > 0) {
						const app = apps[0];
						setCurrentApp({ id: app.appId, name: app.name });
					}
				}
			}

			// Load saved theme preference
			if (credentials.settings?.theme) {
				const savedTheme = credentials.settings.theme;
				if (getThemeNames().includes(savedTheme)) {
					setThemeName(savedTheme);
				}
			}

			// Welcome message
			addEntry({
				type: "info",
				content: "Welcome to SEMOSS CLI interactive mode!",
			});
			addEntry({
				type: "info",
				content:
					"Type :help for available commands or enter a Pixel command to execute.",
			});
		} catch (error) {
			addEntry({
				type: "error",
				content: `Failed to load configuration: ${error}`,
			});
		}
	};

	const addEntry = (entry: Omit<OutputEntry, "id" | "timestamp">): void => {
		setEntries((prev) => [
			...prev,
			{
				...entry,
				id: `${Date.now()}-${Math.random()}`,
				timestamp: new Date(),
			},
		]);
	};

	/** Remove spinner entries once a command finishes. */
	const removeLoadingEntries = (): void => {
		setEntries((prev) => prev.filter((e) => e.type !== "loading"));
	};

	const handleCommand = async (command: string) => {
		if (pendingCreateAction) {
			addEntry({ type: "command", content: command });
			const response = command.trim();

			if (pendingCreateAction.step === "name") {
				if (!response) {
					addEntry({
						type: "info",
						content: "App name is required. Please enter a name.",
					});
					return;
				}

				setPendingCreateAction({
					step: "allInstances",
					args: [...pendingCreateAction.args, "--name", response],
				});
				addEntry({
					type: "info",
					content:
						"Create this app on all configured instances? (y/n)",
				});
				return;
			}

			const normalized = response.toLowerCase();
			if (normalized === "y" || normalized === "yes") {
				setPendingCreateAction(null);
				await executeCreateCommand([
					...pendingCreateAction.args,
					"--all-instances",
				]);
			} else if (normalized === "n" || normalized === "no") {
				setPendingCreateAction(null);
				await executeCreateCommand([
					...pendingCreateAction.args,
					"--no-all-instances",
				]);
			} else {
				addEntry({
					type: "info",
					content: "Please enter 'y' or 'n'",
				});
			}
			return;
		}

		// Check if there's a pending confirmation
		if (pendingAction) {
			const response = command.toLowerCase().trim();
			addEntry({ type: "command", content: command });

			if (response === "y" || response === "yes") {
				const { flags, dryRun, targets } = pendingAction;
				setPendingAction(null);
				await executeDeploy(flags, dryRun, targets);
			} else if (response === "n" || response === "no") {
				setPendingAction(null);
				addEntry({ type: "info", content: "Deploy cancelled." });
			} else {
				addEntry({ type: "info", content: "Please enter 'y' or 'n'" });
			}
			return;
		}

		// Add command to output
		addEntry({ type: "command", content: command });

		// Add to history
		commandHistory.addCommand(command);

		// Check if it's a shell command (! prefix)
		if (command.startsWith("!")) {
			await handleShellCommand(command.slice(1).trim());
		}
		// Check if it's a built-in command
		else if (command.startsWith(":")) {
			await handleBuiltinCommand(command);
		} else {
			await handlePixelCommand(command);
		}
	};

	const handleBuiltinCommand = async (command: string) => {
		const [cmd, ...args] = command.slice(1).split(" ");

		switch (cmd) {
			case "help":
				showHelp();
				break;
			case "exit":
			case "quit":
				exit();
				break;
			case "clear":
				setEntries([]);
				addEntry({
					type: "info",
					content: "Output cleared",
				});
				break;
			case "status":
				showStatus();
				break;
			case "init":
				await handleInitCommand(args);
				break;
			case "deploy":
				await handleDeployCommand(args);
				break;
			case "link":
				await handleLinkCommand(args);
				break;
			case "switch":
				await handleSwitchCommand(args);
				break;
			case "apps":
				await handleAppsCommand();
				break;
			case "app":
				await handleAppSwitch(args[0]);
				break;
			case "pwd":
				showWorkingDirectory();
				break;
			case "instances":
				handleInstancesCommand();
				break;
			case "whoami":
				await handleWhoamiCommand();
				break;
			case "log":
				await handleLogCommand(args);
				break;
			case "open":
				await handleOpenCommand(args);
				break;
			case "publish":
				await handlePublishCommand(args);
				break;
			case "config":
				await handleConfigCommand(args);
				break;
			case "cleanup":
				await handleCleanupCommand(args);
				break;
			case "onboard":
				await handleOnboardCommand();
				break;
			case "create":
				await handleCreateCommand(args);
				break;
			case "connect":
				await handleConnectCommand(args);
				break;
			case "pixel":
				addEntry({
					type: "info",
					content:
						"Enter Pixel commands directly without the :pixel prefix.",
				});
				addEntry({
					type: "info",
					content: "Example: GetUserInfo();",
				});
				break;
			case "snake":
				setGameMode("snake");
				break;
			case "theme":
				handleThemeCommand(args);
				break;
			default:
				addEntry({
					type: "error",
					content: `Unknown command: :${cmd}. Type :help for available commands.`,
				});
		}
	};

	const handlePixelCommand = async (command: string) => {
		if (!connected) {
			addEntry({
				type: "error",
				content:
					"Not connected to any instance. Use Ctrl+C to exit and run 'semoss connect' first.",
			});
			return;
		}

		setLoading(true);
		addEntry({
			type: "loading",
			content: "Executing Pixel command...",
		});

		try {
			const result = await executePixelCommand(command);

			if (result.success) {
				const formatted = formatOutput(result.output);
				addEntry({
					type: "result",
					content: formatted,
				});
			} else {
				addEntry({
					type: "error",
					content: result.error || "Unknown error occurred",
				});
			}
		} catch (error) {
			addEntry({
				type: "error",
				content: `Error: ${error instanceof Error ? error.message : String(error)}`,
			});
		} finally {
			removeLoadingEntries();
			setLoading(false);
		}
	};

	// Handle shell commands prefixed with !
	const handleShellCommand = async (command: string) => {
		if (!command) {
			addEntry({
				type: "error",
				content: "No command provided. Usage: !<command>",
			});
			return;
		}

		// Special handling for cd command - subprocess cd doesn't affect parent process
		const cdMatch = command.match(/^cd\s+(.+)$/);
		if (cdMatch || command === "cd") {
			const targetDir = cdMatch
				? cdMatch[1].trim()
				: process.env.HOME || process.env.USERPROFILE || "/";
			try {
				// Handle ~ for home directory
				const resolvedDir = targetDir.startsWith("~")
					? targetDir.replace(
							"~",
							process.env.HOME || process.env.USERPROFILE || "",
						)
					: targetDir;
				process.chdir(resolvedDir);
				addEntry({
					type: "success",
					content: `Changed directory to: ${process.cwd()}`,
				});
				// Refresh git branch since we changed directories
				setGitBranch(getGitBranch());
			} catch (error) {
				addEntry({
					type: "error",
					content: `cd: ${error instanceof Error ? error.message : String(error)}`,
				});
			}
			return;
		}

		// Map common Unix commands to Windows equivalents
		let processedCommand = command;
		if (process.platform === "win32") {
			const unixToWindows: Record<string, string> = {
				ls: "dir",
				cat: "type",
				clear: "cls",
				cp: "copy",
				mv: "move",
				rm: "del",
				pwd: "cd",
				touch: "echo. >",
			};

			// Replace command if it's a simple Unix command at the start
			const parts = command.split(/\s+/);
			const cmd = parts[0].toLowerCase();
			if (unixToWindows[cmd]) {
				parts[0] = unixToWindows[cmd];
				processedCommand = parts.join(" ");
			}
		}

		setLoading(true);
		addEntry({
			type: "loading",
			content: `Running: ${command}`,
		});

		try {
			const shellProcess = spawn(processedCommand, {
				cwd: process.cwd(),
				shell: true,
				stdio: ["pipe", "pipe", "pipe"],
			});

			let output = "";
			let errorOutput = "";

			shellProcess.stdout?.on("data", (data: Buffer) => {
				output += data.toString();
			});

			shellProcess.stderr?.on("data", (data: Buffer) => {
				errorOutput += data.toString();
			});

			const exitCode = await new Promise<number | null>(
				(resolve, reject) => {
					shellProcess.on("close", (code) => {
						resolve(code);
					});

					shellProcess.on("error", (err) => {
						reject(err);
					});
				},
			);

			if (output.trim()) {
				addEntry({
					type: "result",
					content: output.trim(),
				});
			}

			if (errorOutput.trim()) {
				addEntry({
					type: exitCode === 0 ? "info" : "error",
					content: errorOutput.trim(),
				});
			}

			if (exitCode !== 0) {
				addEntry({
					type: "error",
					content: `Command exited with code ${exitCode}`,
				});
			}
		} catch (error) {
			addEntry({
				type: "error",
				content: `Shell error: ${error instanceof Error ? error.message : String(error)}`,
			});
		} finally {
			removeLoadingEntries();
			setLoading(false);
			// Refresh git branch in case it changed (e.g., git checkout)
			setGitBranch(getGitBranch());
		}
	};

	const showHelp = () => {
		const helpText = `
Built-in Commands:
  :help           Show this help message
  :status         Display current instance and app info
  :whoami         Show current user from server
  :pwd            Show current working directory
  :instances      List all configured instances
  :apps           List available apps from server
  :app [name]     Show or switch to an app
  :deploy [opts]  Deploy current app to instance
                  Options: --dry-run, --rollback, --target=<dir>
  :publish        Publish current app (init, run reactors, publish)
  :open           Open app in browser
  :log [opts]     Show deployment history
                  Options: --limit=N, --verbose, --files
  :config [opts]  Generate smss.json config file
                  Options: --force
  :cleanup [opts] Clean up backup files
                  Options: --force, --list
  :init           Initialize a new app in current directory
  :link [app-id]  Link directory to an app (uses .env APP if omitted)
  :switch <name>  Switch to a different instance
  :connect [url]  Connect to a new instance
  :create [opts]  Create a new app from template
                  Options: --name="App Name", --template=react|next
  :onboard        Run onboarding wizard (exits TUI)
  :theme [name]   List themes or switch to a theme
  :clear          Clear output history
  :exit           Exit interactive mode (or press Ctrl+C)
 
Shell Commands:
  !<command>      Run a shell command (e.g., !ls, !dir, !git status)
 
Pixel Commands:
  Enter any Pixel command directly (without colon prefix)
  Example: GetUserInfo();
  Example: MyProjects();
 
Deploy Examples:
  :deploy                    Deploy current app
  :deploy --dry-run         Preview deployment
  :deploy --target=java     Deploy only java folder
  :deploy --rollback        Rollback to previous version
 
Keyboard Shortcuts:
  ↑ / ↓              Navigate command history
  Shift+↑ / Shift+↓  Scroll output (also PgUp/PgDn)
  Ctrl+?              Show this help
  Ctrl+L / :clear     Clear output
  Ctrl+C / Esc        Exit
        `.trim();

		addEntry({ type: "info", content: helpText });
	};

	const handleThemeCommand = (args: string[]) => {
		const themes = getThemeNames();

		if (args.length === 0) {
			// Show available themes
			addEntry({
				type: "info",
				content: "Available themes:",
			});
			for (const name of themes) {
				const theme = getTheme(name);
				const isCurrent = name === themeName;
				const marker = isCurrent ? "●" : "○";
				addEntry({
					type: "info",
					content: `  ${marker} ${name} - ${theme.name}`,
				});
			}
			addEntry({
				type: "info",
				content: "\nUse: :theme <name> to switch",
			});
			return;
		}

		const newTheme = args[0].toLowerCase();
		if (!themes.includes(newTheme)) {
			addEntry({
				type: "error",
				content: `Unknown theme: ${newTheme}. Use :theme to see available themes.`,
			});
			return;
		}

		setThemeName(newTheme);
		const theme = getTheme(newTheme);

		// Persist theme preference
		const creds = loadCredentials();
		creds.settings = creds.settings || {};
		creds.settings.theme = newTheme;
		saveCredentials(creds);

		addEntry({
			type: "success",
			content: `Theme changed to: ${theme.name}`,
		});
	};

	const showWorkingDirectory = () => {
		const cwd = process.cwd();
		addEntry({
			type: "info",
			content: `Current directory: ${cwd}`,
		});
		addEntry({
			type: "info",
			content:
				"Note: To change directories, exit the TUI and use 'cd' in your shell.",
		});
	};

	const handleAppsCommand = async () => {
		if (!connected) {
			addEntry({
				type: "error",
				content: "Not connected to any instance. Cannot list apps.",
			});
			return;
		}

		setLoading(true);
		addEntry({
			type: "loading",
			content: "Fetching apps from server...",
		});

		try {
			const result = await executePixelCommand("MyProjects();");

			if (result.success) {
				const formatted = formatOutput(result.output);
				addEntry({
					type: "result",
					content: formatted,
				});
			} else {
				addEntry({
					type: "error",
					content: result.error || "Failed to fetch apps",
				});
			}
		} catch (error) {
			addEntry({
				type: "error",
				content: `Error: ${error instanceof Error ? error.message : String(error)}`,
			});
		} finally {
			removeLoadingEntries();
			setLoading(false);
		}
	};

	const handleAppSwitch = async (appName: string) => {
		if (!appName) {
			// Show available apps
			if (!instance || !instance.apps) {
				addEntry({
					type: "error",
					content: "No apps configured for this instance",
				});
				return;
			}

			const apps = Object.values(instance.apps);
			if (apps.length === 0) {
				addEntry({
					type: "info",
					content:
						"No apps linked yet. Exit TUI and use 'semoss link <app-id>' in your app directory.",
				});
				return;
			}

			addEntry({
				type: "info",
				content: "Available apps:",
			});
			apps.forEach((app) => {
				const isCurrent = currentApp?.id === app.appId;
				const marker = isCurrent ? "●" : "○";
				addEntry({
					type: "info",
					content: `  ${marker} ${app.name} (${app.appId}) - ${app.path}`,
				});
			});
			addEntry({
				type: "info",
				content: "\nUse: :app <name> to switch",
			});
			return;
		}

		// Switch to the specified app
		if (!instance || !instance.apps) {
			addEntry({
				type: "error",
				content: "No apps configured",
			});
			return;
		}

		// Find app by name or appId
		const app = Object.values(instance.apps).find(
			(a) => a.name === appName || a.appId === appName,
		);

		if (!app) {
			addEntry({
				type: "error",
				content: `App not found: ${appName}. Use :app to see available apps.`,
			});
			return;
		}

		// Update current app
		setCurrentApp({ id: app.appId, name: app.name });

		// Update credentials with current app
		const creds = loadCredentials();
		creds.currentApp = app.appId;
		saveCredentials(creds);

		addEntry({
			type: "success",
			content: `Switched to app: ${app.name}`,
		});
		addEntry({
			type: "info",
			content: `App ID: ${app.appId}`,
		});
		addEntry({
			type: "info",
			content: `Path: ${app.path}`,
		});
	};

	const handleDeployCommand = async (args: string[]) => {
		if (!connected || !instance) {
			addEntry({
				type: "error",
				content: "Not connected to any instance. Cannot deploy.",
			});
			return;
		}

		if (!currentApp) {
			addEntry({
				type: "error",
				content: "No app selected. Use :app to select an app first.",
			});
			return;
		}

		// Parse deploy flags from args
		const flags: string[] = [];
		let dryRun = false;
		const targets: string[] = [];

		let skipConfirm = false;

		for (const arg of args) {
			if (arg === "--dry-run" || arg === "-d") {
				dryRun = true;
				flags.push("--dryRun");
			} else if (arg === "--rollback" || arg === "-r") {
				flags.push("--rollback");
			} else if (arg === "--yes" || arg === "-y") {
				skipConfirm = true;
			} else if (arg.startsWith("--target=")) {
				const target = arg.split("=")[1];
				targets.push(target);
				flags.push("--target", target);
			} else if (arg.startsWith("-t=")) {
				const target = arg.split("=")[1];
				targets.push(target);
				flags.push("--target", target);
			} else {
				flags.push(arg);
			}
		}

		// Dry-run doesn't need confirmation
		if (dryRun) {
			skipConfirm = true;
		}

		// Show confirmation prompt if not skipped
		if (!skipConfirm) {
			const targetMsg =
				targets.length > 0 ? `\nTargets:  ${targets.join(", ")}` : "";
			const appInfo = currentApp?.name
				? `${currentApp.name} (${currentApp.id})`
				: currentApp?.id || "unknown";
			const confirmMsg = `⚠️  Deployment Confirmation
${"─".repeat(50)}
Source:   ${process.cwd()}
Instance: ${instanceName}
Module:   ${instance?.module || "unknown"}
App:      ${appInfo}${targetMsg}
${"─".repeat(50)}
This action will replace the current deployment. Use --rollback to revert if needed.
 
Proceed? (y/n)`;
			addEntry({
				type: "info",
				content: confirmMsg,
			});

			setPendingAction({ type: "deploy", args, flags, dryRun, targets });
			return;
		}

		await executeDeploy(flags, dryRun, targets);
	};

	const executeDeploy = async (
		flags: string[],
		dryRun: boolean,
		targets: string[],
	) => {
		setLoading(true);

		const deployMsg = dryRun
			? "🔍 Running deployment preview (dry-run)..."
			: targets.length > 0
				? `🚀 Deploying ${targets.join(", ")} to ${instanceName}...`
				: `🚀 Deploying to ${instanceName}...`;

		addEntry({
			type: "loading",
			content: deployMsg,
		});

		try {
			// Get the CLI executable path
			const cliPath = fileURLToPath(
				new URL("../../bin/run.js", import.meta.url),
			);

			// Spawn deploy command as child process
			// Always pass --yes since confirmation is handled at TUI level
			const deployProcess = spawn(
				"node",
				[cliPath, "deploy", "--logLevel", "debug", "--yes", ...flags],
				{
					cwd: process.cwd(),
					stdio: ["pipe", "pipe", "pipe"],
				},
			);

			// Stream output in real-time
			let outputBuffer = "";

			deployProcess.stdout?.on("data", (data: Buffer) => {
				const text = data.toString();
				outputBuffer += text;

				// Process complete lines
				const lines = outputBuffer.split("\n");
				outputBuffer = lines.pop() || ""; // Keep incomplete line in buffer

				for (const line of lines) {
					const trimmed = line.trim();
					if (trimmed) {
						// Remove loading entry when we get first output
						removeLoadingEntries();
						addEntry({
							type: "info",
							content: trimmed,
						});
					}
				}
			});

			deployProcess.stderr?.on("data", (data: Buffer) => {
				const text = data.toString();
				const lines = text.split("\n");
				for (const line of lines) {
					const trimmed = line.trim();
					if (trimmed) {
						removeLoadingEntries();
						addEntry({
							type: "error",
							content: trimmed,
						});
					}
				}
			});

			await new Promise<void>((resolve, reject) => {
				deployProcess.on("close", (code) => {
					if (code === 0) {
						resolve();
					} else {
						reject(
							new Error(
								`Deploy process exited with code ${code}`,
							),
						);
					}
				});

				deployProcess.on("error", (err) => {
					reject(err);
				});
			});

			// Show success
			addEntry({
				type: "success",
				content: dryRun
					? "✓ Dry-run complete - no files were deployed"
					: "✓ Deployment successful!",
			});
		} catch (error) {
			addEntry({
				type: "error",
				content: `Deployment failed: ${error instanceof Error ? error.message : String(error)}`,
			});
		} finally {
			removeLoadingEntries();
			setLoading(false);
		}
	};

	const handleInstancesCommand = () => {
		const credentials = loadCredentials();
		const instanceCount = Object.keys(credentials.instances).length;

		if (instanceCount === 0) {
			addEntry({
				type: "info",
				content:
					"No instances configured. Exit TUI and run: semoss connect",
			});
			return;
		}

		addEntry({
			type: "info",
			content: "Configured Instances:",
		});

		Object.entries(credentials.instances).forEach(([name, config]) => {
			const isCurrent = credentials.currentInstance === name;
			const marker = isCurrent ? "●" : "○";
			const appCount = Object.keys(config.apps || {}).length;
			addEntry({
				type: "info",
				content: `  ${marker} ${name} - ${config.module} (${appCount} app${appCount !== 1 ? "s" : ""})`,
			});
		});

		addEntry({
			type: "info",
			content:
				"\nTo switch instances, exit TUI and run: semoss switch <name>",
		});
	};

	const handleWhoamiCommand = async () => {
		if (!connected) {
			addEntry({
				type: "error",
				content: "Not connected to any instance.",
			});
			return;
		}

		setLoading(true);
		addEntry({
			type: "loading",
			content: "Fetching user info...",
		});

		try {
			const result = await executePixelCommand("GetUserInfo();");

			if (result.success) {
				const formatted = formatOutput(result.output);
				addEntry({
					type: "result",
					content: formatted,
				});
			} else {
				addEntry({
					type: "error",
					content: result.error || "Failed to get user info",
				});
			}
		} catch (error) {
			addEntry({
				type: "error",
				content: `Error: ${error instanceof Error ? error.message : String(error)}`,
			});
		} finally {
			removeLoadingEntries();
			setLoading(false);
		}
	};

	const handleLogCommand = async (args: string[]) => {
		setLoading(true);
		addEntry({
			type: "loading",
			content: "Fetching deployment history...",
		});

		try {
			const cliPath = fileURLToPath(
				new URL("../../bin/run.js", import.meta.url),
			);

			const logProcess = spawn("node", [cliPath, "log", ...args], {
				cwd: process.cwd(),
				stdio: ["pipe", "pipe", "pipe"],
			});

			let output = "";

			logProcess.stdout?.on("data", (data: Buffer) => {
				output += data.toString();
			});

			logProcess.stderr?.on("data", (data: Buffer) => {
				output += data.toString();
			});

			await new Promise<void>((resolve) => {
				logProcess.on("close", () => resolve());
			});

			if (output.trim()) {
				addEntry({
					type: "result",
					content: output.trim(),
				});
			} else {
				addEntry({
					type: "info",
					content: "No deployment history found.",
				});
			}
		} catch (error) {
			addEntry({
				type: "error",
				content: `Error: ${error instanceof Error ? error.message : String(error)}`,
			});
		} finally {
			removeLoadingEntries();
			setLoading(false);
		}
	};

	const handleOpenCommand = async (args: string[]) => {
		setLoading(true);
		addEntry({
			type: "loading",
			content: "Opening in browser...",
		});

		try {
			const cliPath = fileURLToPath(
				new URL("../../bin/run.js", import.meta.url),
			);

			const openProcess = spawn("node", [cliPath, "open", ...args], {
				cwd: process.cwd(),
				stdio: ["pipe", "pipe", "pipe"],
			});

			let output = "";
			let errorOutput = "";

			openProcess.stdout?.on("data", (data: Buffer) => {
				output += data.toString();
			});

			openProcess.stderr?.on("data", (data: Buffer) => {
				errorOutput += data.toString();
			});

			const exitCode = await new Promise<number | null>((resolve) => {
				openProcess.on("close", (code) => resolve(code));
			});

			if (exitCode === 0 && output.trim()) {
				addEntry({
					type: "success",
					content: output.trim(),
				});
			} else if (errorOutput.trim()) {
				addEntry({
					type: "error",
					content: errorOutput.trim(),
				});
			} else if (output.trim()) {
				addEntry({
					type: "info",
					content: output.trim(),
				});
			} else {
				addEntry({
					type: "info",
					content: "Open command completed",
				});
			}
		} catch (error) {
			addEntry({
				type: "error",
				content: `Error: ${error instanceof Error ? error.message : String(error)}`,
			});
		} finally {
			removeLoadingEntries();
			setLoading(false);
		}
	};

	const handlePublishCommand = async (args: string[]) => {
		if (!connected || !instance) {
			addEntry({
				type: "error",
				content: "Not connected to any instance. Cannot publish.",
			});
			return;
		}

		setLoading(true);
		addEntry({
			type: "loading",
			content: `📤 Publishing to ${instanceName}...`,
		});

		try {
			const cliPath = fileURLToPath(
				new URL("../../bin/run.js", import.meta.url),
			);

			const publishProcess = spawn(
				"node",
				[cliPath, "publish", ...args],
				{
					cwd: process.cwd(),
					stdio: ["pipe", "pipe", "pipe"],
				},
			);

			let output = "";
			let errorOutput = "";

			publishProcess.stdout?.on("data", (data: Buffer) => {
				output += data.toString();
			});

			publishProcess.stderr?.on("data", (data: Buffer) => {
				errorOutput += data.toString();
			});

			const exitCode = await new Promise<number | null>((resolve) => {
				publishProcess.on("close", (code) => resolve(code));
			});

			if (exitCode === 0) {
				addEntry({
					type: "success",
					content: "✓ Publish successful!",
				});
				if (output.trim()) {
					const lines = output.trim().split("\n");
					const relevantLines = lines.slice(-5).join("\n");
					if (relevantLines) {
						addEntry({
							type: "info",
							content: relevantLines,
						});
					}
				}
			} else {
				addEntry({
					type: "error",
					content: `Publish failed${errorOutput ? `: ${errorOutput.trim()}` : ""}`,
				});
			}
		} catch (error) {
			addEntry({
				type: "error",
				content: `Publish failed: ${error instanceof Error ? error.message : String(error)}`,
			});
		} finally {
			removeLoadingEntries();
			setLoading(false);
		}
	};

	const handleConfigCommand = async (args: string[]) => {
		setLoading(true);
		addEntry({
			type: "loading",
			content: "Generating smss.json config...",
		});

		try {
			const cliPath = fileURLToPath(
				new URL("../../bin/run.js", import.meta.url),
			);

			const configProcess = spawn("node", [cliPath, "config", ...args], {
				cwd: process.cwd(),
				stdio: ["pipe", "pipe", "pipe"],
			});

			let output = "";

			configProcess.stdout?.on("data", (data: Buffer) => {
				output += data.toString();
			});

			const exitCode = await new Promise<number | null>((resolve) => {
				configProcess.on("close", (code) => resolve(code));
			});

			if (exitCode === 0) {
				addEntry({
					type: "success",
					content: output.trim() || "✓ Config file generated",
				});
			} else {
				addEntry({
					type: "error",
					content: output.trim() || "Failed to generate config",
				});
			}
		} catch (error) {
			addEntry({
				type: "error",
				content: `Error: ${error instanceof Error ? error.message : String(error)}`,
			});
		} finally {
			removeLoadingEntries();
			setLoading(false);
		}
	};

	const handleCleanupCommand = async (args: string[]) => {
		// Check if --force or --list is provided, otherwise prompt to exit TUI
		const hasForce = args.includes("--force") || args.includes("-f");
		const hasList = args.includes("--list") || args.includes("-l");

		if (!hasForce && !hasList) {
			addEntry({
				type: "info",
				content:
					"Cleanup requires confirmation. Use :cleanup --list to preview or :cleanup --force to delete.",
			});
			addEntry({
				type: "info",
				content:
					"Or exit the TUI and run: semoss cleanup (for interactive mode)",
			});
			return;
		}

		setLoading(true);
		addEntry({
			type: "loading",
			content: hasList ? "Listing backups..." : "Cleaning up backups...",
		});

		try {
			const cliPath = fileURLToPath(
				new URL("../../bin/run.js", import.meta.url),
			);

			const cleanupProcess = spawn(
				"node",
				[cliPath, "cleanup", ...args],
				{
					cwd: process.cwd(),
					stdio: ["pipe", "pipe", "pipe"],
				},
			);

			let output = "";

			cleanupProcess.stdout?.on("data", (data: Buffer) => {
				output += data.toString();
			});

			await new Promise<void>((resolve) => {
				cleanupProcess.on("close", () => resolve());
			});

			addEntry({
				type: hasList ? "result" : "success",
				content: output.trim() || "✓ Cleanup complete",
			});
		} catch (error) {
			addEntry({
				type: "error",
				content: `Error: ${error instanceof Error ? error.message : String(error)}`,
			});
		} finally {
			removeLoadingEntries();
			setLoading(false);
		}
	};

	const handleInitCommand = async (args: string[]) => {
		setLoading(true);
		addEntry({
			type: "loading",
			content: "Initializing app...",
		});

		try {
			const cliPath = fileURLToPath(
				new URL("../../bin/run.js", import.meta.url),
			);

			const initProcess = spawn("node", [cliPath, "init", ...args], {
				cwd: process.cwd(),
				stdio: ["pipe", "pipe", "pipe"],
			});

			let output = "";
			let errorOutput = "";

			initProcess.stdout?.on("data", (data: Buffer) => {
				output += data.toString();
			});

			initProcess.stderr?.on("data", (data: Buffer) => {
				errorOutput += data.toString();
			});

			const exitCode = await new Promise<number | null>((resolve) => {
				initProcess.on("close", (code) => resolve(code));
			});

			if (exitCode === 0) {
				addEntry({
					type: "success",
					content: output.trim() || "✓ App initialized",
				});
			} else {
				addEntry({
					type: "error",
					content:
						errorOutput.trim() ||
						output.trim() ||
						"Failed to initialize app",
				});
			}
		} catch (error) {
			addEntry({
				type: "error",
				content: `Error: ${error instanceof Error ? error.message : String(error)}`,
			});
		} finally {
			removeLoadingEntries();
			setLoading(false);
		}
	};

	const handleLinkCommand = async (args: string[]) => {
		setLoading(true);
		addEntry({
			type: "loading",
			content: "Linking directory to app...",
		});

		try {
			const cliPath = fileURLToPath(
				new URL("../../bin/run.js", import.meta.url),
			);

			const linkProcess = spawn("node", [cliPath, "link", ...args], {
				cwd: process.cwd(),
				stdio: ["pipe", "pipe", "pipe"],
			});

			let output = "";
			let errorOutput = "";

			linkProcess.stdout?.on("data", (data: Buffer) => {
				output += data.toString();
			});

			linkProcess.stderr?.on("data", (data: Buffer) => {
				errorOutput += data.toString();
			});

			const exitCode = await new Promise<number | null>((resolve) => {
				linkProcess.on("close", (code) => resolve(code));
			});

			if (exitCode === 0) {
				addEntry({
					type: "success",
					content: output.trim() || "✓ Directory linked to app",
				});
			} else {
				addEntry({
					type: "error",
					content:
						errorOutput.trim() ||
						output.trim() ||
						"Failed to link directory",
				});
			}
		} catch (error) {
			addEntry({
				type: "error",
				content: `Error: ${error instanceof Error ? error.message : String(error)}`,
			});
		} finally {
			removeLoadingEntries();
			setLoading(false);
		}
	};

	const handleSwitchCommand = async (args: string[]) => {
		if (args.length === 0) {
			addEntry({
				type: "error",
				content: "Usage: :switch <instance-name>",
			});
			return;
		}

		setLoading(true);
		addEntry({
			type: "loading",
			content: `Switching to instance: ${args[0]}...`,
		});

		try {
			const cliPath = fileURLToPath(
				new URL("../../bin/run.js", import.meta.url),
			);

			const switchProcess = spawn("node", [cliPath, "switch", ...args], {
				cwd: process.cwd(),
				stdio: ["pipe", "pipe", "pipe"],
			});

			let output = "";
			let errorOutput = "";

			switchProcess.stdout?.on("data", (data: Buffer) => {
				output += data.toString();
			});

			switchProcess.stderr?.on("data", (data: Buffer) => {
				errorOutput += data.toString();
			});

			const exitCode = await new Promise<number | null>((resolve) => {
				switchProcess.on("close", (code) => resolve(code));
			});

			if (exitCode === 0) {
				addEntry({
					type: "success",
					content: output.trim() || `✓ Switched to ${args[0]}`,
				});
				addEntry({
					type: "info",
					content:
						"Restart TUI to use new instance: exit and run 'semoss interactive'",
				});
			} else {
				addEntry({
					type: "error",
					content:
						errorOutput.trim() ||
						output.trim() ||
						"Failed to switch instance",
				});
			}
		} catch (error) {
			addEntry({
				type: "error",
				content: `Error: ${error instanceof Error ? error.message : String(error)}`,
			});
		} finally {
			removeLoadingEntries();
			setLoading(false);
		}
	};

	const handleOnboardCommand = async () => {
		addEntry({
			type: "info",
			content:
				"The onboard wizard requires interactive prompts that cannot run inside the TUI.",
		});
		addEntry({
			type: "info",
			content: "Exit and run: semoss onboard",
		});
	};

	const handleCreateCommand = async (args: string[]) => {
		let hasName = false;
		let hasAllInstancesFlag = false;

		for (let index = 0; index < args.length; index++) {
			const arg = args[index];

			if (arg === "--all-instances" || arg === "--no-all-instances") {
				hasAllInstancesFlag = true;
			}

			if (arg.startsWith("--name=") || arg.startsWith("-n=")) {
				hasName = true;
				continue;
			}

			if (arg === "--name" || arg === "-n") {
				const nextArg = args[index + 1];
				if (nextArg && !nextArg.startsWith("-")) {
					hasName = true;
				}
			}
		}

		if (!hasName) {
			setPendingCreateAction({
				step: "name",
				args,
			});
			addEntry({
				type: "info",
				content: "What is the app name?",
			});
			return;
		}

		if (!hasAllInstancesFlag) {
			setPendingCreateAction({
				step: "allInstances",
				args,
			});
			addEntry({
				type: "info",
				content: "Create this app on all configured instances? (y/n)",
			});
			return;
		}

		await executeCreateCommand(args);
	};

	const executeCreateCommand = async (args: string[]) => {
		setLoading(true);
		addEntry({
			type: "loading",
			content: "Creating app from template...",
		});

		try {
			const cliPath = fileURLToPath(
				new URL("../../bin/run.js", import.meta.url),
			);

			const createProcess = spawn("node", [cliPath, "create", ...args], {
				cwd: process.cwd(),
				stdio: ["pipe", "pipe", "pipe"],
			});

			let output = "";
			let errorOutput = "";

			createProcess.stdout?.on("data", (data: Buffer) => {
				output += data.toString();
			});

			createProcess.stderr?.on("data", (data: Buffer) => {
				errorOutput += data.toString();
			});

			const exitCode = await new Promise<number | null>((resolve) => {
				createProcess.on("close", (code) => resolve(code));
			});

			if (exitCode === 0) {
				addEntry({
					type: "success",
					content: output.trim() || "✓ App created",
				});
			} else {
				addEntry({
					type: "error",
					content:
						errorOutput.trim() ||
						output.trim() ||
						"Failed to create app",
				});
			}
		} catch (error) {
			addEntry({
				type: "error",
				content: `Error: ${error instanceof Error ? error.message : String(error)}`,
			});
		} finally {
			removeLoadingEntries();
			setLoading(false);
		}
	};

	const handleConnectCommand = async (args: string[]) => {
		if (args.length === 0) {
			addEntry({
				type: "info",
				content:
					"The connect wizard requires interactive prompts. Exit and run: semoss connect",
			});
			addEntry({
				type: "info",
				content: "Or use: :connect <url> to connect directly",
			});
			return;
		}

		setLoading(true);
		addEntry({
			type: "loading",
			content: `Connecting to ${args[0]}...`,
		});

		try {
			const cliPath = fileURLToPath(
				new URL("../../bin/run.js", import.meta.url),
			);

			const connectProcess = spawn(
				"node",
				[cliPath, "connect", ...args],
				{
					cwd: process.cwd(),
					stdio: ["pipe", "pipe", "pipe"],
				},
			);

			let output = "";
			let errorOutput = "";

			connectProcess.stdout?.on("data", (data: Buffer) => {
				output += data.toString();
			});

			connectProcess.stderr?.on("data", (data: Buffer) => {
				errorOutput += data.toString();
			});

			const exitCode = await new Promise<number | null>((resolve) => {
				connectProcess.on("close", (code) => resolve(code));
			});

			if (exitCode === 0) {
				addEntry({
					type: "success",
					content: output.trim() || "✓ Connected",
				});
				addEntry({
					type: "info",
					content:
						"Restart TUI to use new instance: exit and run 'semoss interactive'",
				});
			} else {
				addEntry({
					type: "error",
					content:
						errorOutput.trim() ||
						output.trim() ||
						"Failed to connect",
				});
			}
		} catch (error) {
			addEntry({
				type: "error",
				content: `Error: ${error instanceof Error ? error.message : String(error)}`,
			});
		} finally {
			removeLoadingEntries();
			setLoading(false);
		}
	};

	const showStatus = () => {
		if (!instance) {
			addEntry({
				type: "info",
				content: "No instance connected",
			});
			return;
		}

		let statusText = `Instance: ${instanceName}\nModule: ${instance.module}\nConnected: ${connected ? "Yes" : "No"}`;

		if (user) {
			statusText += `\nUser: ${user}`;
		}

		if (currentApp) {
			statusText += `\nApp: ${currentApp.id}`;
			if (currentApp.name) {
				statusText += ` (${currentApp.name})`;
			}
		}

		addEntry({ type: "info", content: statusText });
	};

	// Handle Ctrl+C to exit gracefully and konami code easter egg
	const KONAMI = [
		"up",
		"up",
		"down",
		"down",
		"left",
		"right",
		"left",
		"right",
		"b",
		"a",
	];
	useInput((input, key) => {
		if (key.ctrl && input === "c") {
			exit();
		}

		// Konami code easter egg
		let pressed = "";
		if (key.upArrow) pressed = "up";
		else if (key.downArrow) pressed = "down";
		else if (key.leftArrow) pressed = "left";
		else if (key.rightArrow) pressed = "right";
		else if (input === "b") pressed = "b";
		else if (input === "a") pressed = "a";

		if (pressed) {
			if (pressed === KONAMI[konamiIndex]) {
				const nextIndex = konamiIndex + 1;
				if (nextIndex === KONAMI.length) {
					addEntry({
						type: "success",
						content: `
✨ You found the secret! ✨
 
Crafted with care by Travon, Stella, and Parth
`,
					});
					setKonamiIndex(0);
				} else {
					setKonamiIndex(nextIndex);
				}
			} else if (pressed === KONAMI[0]) {
				setKonamiIndex(1);
			} else {
				setKonamiIndex(0);
			}
		}
	});

	// Calculate output height based on terminal size
	// Header: 3 lines (with app) or 2 lines (without app)
	// Input: 3 lines
	// Footer: 3 lines
	// Total chrome: 8-9 lines
	// Output: remaining space
	const terminalHeight = stdout.rows || 24;
	const headerHeight = currentApp?.id ? 3 : 2;
	const chromeHeight = headerHeight + 3 + 3; // header + input + footer
	const outputHeight = Math.max(10, terminalHeight - chromeHeight - 2); // -2 for padding

	// Render snake game if in game mode
	if (gameMode === "snake") {
		return <SnakeGame onExit={() => setGameMode(null)} />;
	}

	const theme = getTheme(themeName);

	return (
		<Box flexDirection="column" padding={0}>
			<Header
				instance={instanceName}
				appId={currentApp?.id}
				appName={currentApp?.name}
				connected={connected}
				user={user}
				theme={theme}
			/>
			<Output entries={entries} height={outputHeight} />
			<Input
				onSubmit={handleCommand}
				disabled={loading}
				onHistoryUp={commandHistory.navigateUp}
				onHistoryDown={commandHistory.navigateDown}
				placeholder={
					loading ? "Executing..." : "Enter Pixel command or :help"
				}
				gitBranch={gitBranch}
				theme={theme}
			/>
			<Footer
				onExit={exit}
				onHelp={showHelp}
				onClear={() => {
					setEntries([]);
					addEntry({ type: "info", content: "Output cleared" });
				}}
				theme={theme}
			/>
		</Box>
	);
};
