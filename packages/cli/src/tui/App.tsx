import { Box, useApp, useInput, useStdout } from "ink";
import type React from "react";
import { useEffect, useState } from "react";
import { spawn } from "node:child_process";
import type { InstanceConfig } from "../types.js";
import {
	loadCredentials,
	loadGlobalConfig,
	saveGlobalConfig,
} from "../utils/config.js";
import { Footer } from "./components/Footer.js";
import { Header } from "./components/Header.js";
import { Input } from "./components/Input.js";
import { Output, type OutputEntry } from "./components/Output.js";
import { useCommandHistory } from "./hooks/useCommandHistory.js";
import { executePixelCommand, formatOutput } from "./utils/pixel.js";

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
	const [user, _setUser] = useState<string | undefined>();
	const [loading, setLoading] = useState(false);

	// Load initial state
	useEffect(() => {
		loadInitialState();
	}, []);

	const loadInitialState = async () => {
		try {
			const _config = loadGlobalConfig();
			const credentials = loadCredentials();

			const currentName = credentials.currentInstance;

			if (currentName && credentials.instances[currentName]) {
				const current = credentials.instances[currentName];
				setInstanceName(currentName);
				setInstance(current);
				setConnected(true);

				// Check if there's a linked app
				if (current.apps) {
					const apps = Object.values(current.apps);
					if (apps.length > 0) {
						const app = apps[0]; // Get first app for now
						setCurrentApp({ id: app.appId, name: app.name });
					}
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

	const handleCommand = async (command: string) => {
		// Add command to output
		addEntry({ type: "command", content: command });

		// Add to history
		commandHistory.addCommand(command);

		// Check if it's a built-in command
		if (command.startsWith(":")) {
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
				addEntry({
					type: "info",
					content:
						"To initialize a new app, exit the TUI and run: semoss init",
				});
				addEntry({
					type: "info",
					content:
						"The TUI is for running Pixel commands, not creating apps.",
				});
				break;
			case "deploy":
				await handleDeployCommand(args);
				break;
			case "link":
				addEntry({
					type: "info",
					content:
						"To link a directory to an app, exit the TUI and run: semoss link <app-id>",
				});
				break;
			case "switch":
				addEntry({
					type: "info",
					content:
						"To switch instances, exit the TUI and run: semoss switch <instance-name>",
				});
				addEntry({
					type: "info",
					content: "Then re-launch the TUI with: semoss interactive",
				});
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
			default:
				addEntry({
					type: "error",
					content: `Unknown command: :${cmd}. Type :help for available commands.`,
				});
		}
	};

	const handlePixelCommand = async (command: string) => {
		if (!connected || !instance) {
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
			const result = await executePixelCommand(command, {
				module: instance.module,
				accessKey: instance.accessKey,
				secretKey: instance.secretKey,
			});

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
			setLoading(false);
		}
	};

	const showHelp = () => {
		const helpText = `
Built-in Commands:
  :help           Show this help message
  :status         Display current instance and app info
  :pwd            Show current working directory
  :apps           List available apps from server
  :app [name]     Show or switch to an app
  :deploy [opts]  Deploy current app to instance
                  Options: --dry-run, --rollback, --target=<dir>
  :clear          Clear output history
  :exit           Exit interactive mode (or press Ctrl+C)

File Operations (exit TUI first):
  semoss init       Initialize a new app in current directory
  semoss link       Link directory to an app
  semoss switch     Switch to a different instance

Pixel Commands:
  Enter any Pixel command directly (without colon prefix)
  Example: MyInfo();
  Example: MyProjects();

Deploy Examples:
  :deploy                    Deploy current app
  :deploy --dry-run         Preview deployment
  :deploy --target=java     Deploy only java folder
  :deploy --rollback        Rollback to previous version
        `.trim();

		addEntry({ type: "info", content: helpText });
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
		if (!connected || !instance) {
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
			const result = await executePixelCommand("MyProjects();", {
				module: instance.module,
				accessKey: instance.accessKey,
				secretKey: instance.secretKey,
			});

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

		// Update global config
		const config = loadGlobalConfig();
		config.currentApp = app.appId;
		saveGlobalConfig(config);

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

		for (const arg of args) {
			if (arg === "--dry-run" || arg === "-d") {
				dryRun = true;
				flags.push("--dryRun");
			} else if (arg === "--rollback" || arg === "-r") {
				flags.push("--rollback");
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
			const cliPath = new URL("../../bin/run.js", import.meta.url)
				.pathname;

			// Spawn deploy command as child process
			const deployProcess = spawn(
				"node",
				[cliPath, "deploy", "--logLevel", "normal", ...flags],
				{
					cwd: process.cwd(),
					stdio: ["pipe", "pipe", "pipe"],
				},
			);

			let output = "";
			let _errorOutput = "";

			deployProcess.stdout?.on("data", (data: Buffer) => {
				const text = data.toString();
				output += text;
			});

			deployProcess.stderr?.on("data", (data: Buffer) => {
				const text = data.toString();
				_errorOutput += text;
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

			// Show output if there's interesting info
			if (output.trim()) {
				const lines = output.trim().split("\n");
				// Show last few lines of output
				const relevantLines = lines.slice(-5).join("\n");
				if (relevantLines) {
					addEntry({
						type: "info",
						content: relevantLines,
					});
				}
			}
		} catch (error) {
			addEntry({
				type: "error",
				content: `Deployment failed: ${error instanceof Error ? error.message : String(error)}`,
			});
		} finally {
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

	// Handle Ctrl+C to exit gracefully
	useInput((input, key) => {
		if (key.ctrl && input === "c") {
			exit();
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

	return (
		<Box flexDirection="column" padding={0}>
			<Header
				instance={instanceName}
				appId={currentApp?.id}
				appName={currentApp?.name}
				connected={connected}
				user={user}
			/>
			<Output entries={entries} height={outputHeight} />
			<Input
				onSubmit={handleCommand}
				disabled={loading}
				placeholder={
					loading ? "Executing..." : "Enter Pixel command or :help"
				}
			/>
			<Footer />
		</Box>
	);
};
