import React, { useEffect } from "react";
import ChatHeader from "./components/ChatHeader";
import MessageList from "./components/MessageList";
import InteractionArea from "./components/OptionsPanel";
import SettingsManager from "./components/SettingsManager/SettingsManager";
import { useChatState } from "./hooks/useChatState";
import { useViewport } from "./hooks/useViewport";
import { useVSCodeAPI } from "./hooks/useVSCodeAPI";
import "./App.css";

/**
 * Input dialog component for collecting user inputs
 */
const InputDialog = ({ fields, onSubmit, onCancel, isVisible }) => {
	const [inputs, setInputs] = React.useState({});

	// Normalize fields: string => { label, required:true }
	const normalized = React.useMemo(() => {
		if (!fields || typeof fields !== "object") return {};
		const result = {};
		try {
			Object.entries(fields).forEach(([key, value]) => {
				if (typeof value === "string") {
					result[key] = { label: value, required: true };
				} else if (value && typeof value === "object") {
					result[key] = { required: true, ...value };
				}
			});
		} catch (e) {
			console.warn("InputDialog normalization failed", e);
		}
		return result;
	}, [fields]);

	if (!isVisible || !fields) return null; // after hooks

	const handleInputChange = (field, value, type = "text") => {
		// For boolean style controls (checkbox / toggle) coerce to boolean
		const isBooleanControl = type === "checkbox" || type === "toggle";
		setInputs((prev) => ({
			...prev,
			[field]: isBooleanControl ? !!value : value,
		}));
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		const submission = {};
		Object.entries(normalized).forEach(([key, cfg]) => {
			if (cfg.showIf) {
				const { field, equals } = cfg.showIf;
				if (inputs[field] !== equals) return; // skip hidden
			}
			submission[key] = inputs[key];
		});
		onSubmit(submission);
	};

	const detectSensitiveType = (name) => {
		const sensitiveFields = ["key", "token", "password", "secret"];
		return sensitiveFields.some((f) => name.toLowerCase().includes(f))
			? "password"
			: "text";
	};

	const shouldShow = (cfg) => {
		if (!cfg.showIf) return true;
		const { field, equals } = cfg.showIf;
		return inputs[field] === equals;
	};

	return (
		<div className="input-dialog-overlay">
			<div className="input-dialog">
				<h3>Please provide the following information:</h3>
				<form onSubmit={handleSubmit}>
					{Object.entries(normalized).map(([key, cfg]) => {
						if (!shouldShow(cfg)) return null;
						const inputType =
							cfg.type === "checkbox"
								? "checkbox"
								: cfg.type === "toggle"
									? "toggle"
									: cfg.type || detectSensitiveType(key);
						const value =
							inputs[key] ||
							(inputType === "checkbox" || inputType === "toggle"
								? false
								: "");
						return (
							<div key={key} className="input-group">
								<label htmlFor={key}>
									{cfg.label}
									{cfg.required === false
										? " (optional)"
										: ""}
									:
								</label>
								{inputType === "checkbox" ? (
									<input
										id={key}
										type="checkbox"
										checked={!!value}
										onChange={(e) =>
											handleInputChange(
												key,
												e.target.checked,
												"checkbox",
											)
										}
									/>
								) : inputType === "toggle" ? (
									<button
										id={key}
										type="button"
										className={`toggle-switch ${value ? "on" : "off"}`}
										role="switch"
										aria-checked={!!value}
										onClick={() =>
											handleInputChange(
												key,
												!value,
												"toggle",
											)
										}
										onKeyDown={(e) => {
											if (
												e.key === "Enter" ||
												e.key === " "
											) {
												e.preventDefault();
												handleInputChange(
													key,
													!value,
													"toggle",
												);
											}
										}}
									>
										<span className="toggle-handle" />
										<span className="visually-hidden">
											{cfg.label} {value ? "On" : "Off"}
										</span>
									</button>
								) : (
									<input
										id={key}
										type={inputType}
										value={value}
										onChange={(e) =>
											handleInputChange(
												key,
												e.target.value,
											)
										}
										placeholder={
											cfg.placeholder || cfg.label
										}
										required={cfg.required !== false}
									/>
								)}
							</div>
						);
					})}
					<div className="dialog-buttons">
						<button type="submit">Submit</button>
						<button type="button" onClick={onCancel}>
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

/**
 * Main Semoss Chatbot App Component
 */
const SemossChatbotApp = () => {
	console.log("SemossChatbotApp component rendering...");

	const { postMessage } = useVSCodeAPI();
	const viewport = useViewport();
	const {
		chatStarted,
		chatHistory,
		isLoading,
		hasSmssFile,
		instanceUrls,
		currentInstance,
		addMessage,
		addToolsMessage,
		clearChat,
		executeCommand,
		saveState,
	} = useChatState();

	// State for UI interactions
	// Static options panel disabled; rely on tools-injected messages
	const [showOptions, setShowOptions] = React.useState(false); // kept for compatibility with InteractionArea but always false unless explicitly toggled (not used now)
	const [currentOptions, setCurrentOptions] = React.useState([]);
	const [showInputDialog, setShowInputDialog] = React.useState(false);
	const [inputFields, setInputFields] = React.useState(null);
	const [pendingCommand, setPendingCommand] = React.useState(null);
	const [showSettings, setShowSettings] = React.useState(false);
	// Instance selection/removal UI state comes from hook (instancesList, instancesMode)
	const { instancesList, instancesMode } = useChatState();
	const [currentModel, setCurrentModel] = React.useState(null);
	// For inline confirm on remove instance (avoid window.confirm in webview)
	const [pendingRemoval, setPendingRemoval] = React.useState(null);

	// Update viewport classes on body
	useEffect(() => {
		const { isMobile, isTablet, isDesktop, isSmallPhone, isLandscape } =
			viewport;

		// Clear existing classes
		document.body.classList.remove(
			"mobile-device",
			"tablet-device",
			"desktop-device",
			"small-phone",
			"landscape",
			"portrait",
		);

		// Add device type classes
		if (isSmallPhone) document.body.classList.add("small-phone");
		if (isMobile) document.body.classList.add("mobile-device");
		if (isTablet) document.body.classList.add("tablet-device");
		if (isDesktop) document.body.classList.add("desktop-device");

		// Add orientation classes
		if (isLandscape) {
			document.body.classList.add("landscape");
		} else {
			document.body.classList.add("portrait");
		}
	}, [viewport]);

	// Handle keyboard shortcuts
	useEffect(() => {
		const handleKeyboard = (event) => {
			// Ctrl/Cmd + K to clear chat
			if ((event.ctrlKey || event.metaKey) && event.key === "k") {
				event.preventDefault();
				clearChat();
			}

			// Escape to close dialogs
			if (event.key === "Escape") {
				setShowInputDialog(false);
				setInputFields(null);
				setPendingCommand(null);
			}
		};

		document.addEventListener("keydown", handleKeyboard);
		return () => document.removeEventListener("keydown", handleKeyboard);
	}, [clearChat]);

	// Start chat handler
	const handleStart = () => {
		addMessage(
			"Hello! I'm your Semoss assistant. Let me check your project setup.",
			"bot",
		);
		// Do not show static options panel; rely on tools icon per new requirement
		saveState("started");

		// Check for SMSS file
		postMessage({ type: "checkSmssFile" });
	};

	// Generate options based on current state
	const generateOptions = React.useCallback(() => {
		if (hasSmssFile) {
			return [
				{
					label: "Zip and Deploy",
					command: "semoss.zipanddeploy",
					icon: "🚀",
				},
				{ label: "Zip Only", command: "semoss.ziponly", icon: "📦" },
				{
					label: "Deploy Only",
					command: "semoss.deployonly",
					icon: "🌐",
				},
			];
		}
		return [
			{
				label: "Create New App",
				command: "semoss.createNewApp",
				icon: "✨",
			},
			{
				label: "Authorize New Instance",
				command: "semoss.authorize",
				icon: "🔐",
			},
			{
				label: "Select Instance",
				command: "semoss.selectInstance",
				icon: "🔄",
			},
			{
				label: "Remove Instance",
				command: "semoss.removeInstance",
				icon: "🗑️",
			},
		];
	}, [hasSmssFile]);

	// Keep currentOptions in sync (used when user opens tools) but do not auto-display panel
	useEffect(() => {
		setCurrentOptions(generateOptions());
	}, [generateOptions]);

	// Option click handler
	const handleOptionClick = (option) => {
		const { command, label } = option;

		addMessage(label, "user");

		// Intercept instance selection/removal to request list from extension for in-chat UI
		if (
			command === "semoss.selectInstance" ||
			command === "semoss.removeInstance"
		) {
			// Ask extension for list of instances (mode select/remove)
			postMessage({
				type: "listInstances",
				mode: command === "semoss.selectInstance" ? "select" : "remove",
			});
			return;
		}

		// Commands that need input collection
		const inputCommands = {
			"semoss.authorize": {
				alias: "Instance Alias",
				url: "Semoss URL",
				accessKey: "Access Key",
				privateKey: "Private Key",
			},
			"semoss.createNewApp": {
				appName: { label: "App Name", required: true },
				description: {
					label: "Description",
					required: false,
					placeholder: "(optional)",
				},
				githubLink: {
					label: "GitHub Link",
					required: false,
					placeholder: "(optional)",
				},
				isPrivateRepo: {
					label: "Private Repository",
					type: "toggle",
					required: false,
				},
				accessToken: {
					label: "Access Token",
					required: true,
					showIf: { field: "isPrivateRepo", equals: true },
				},
			},
		};

		if (inputCommands[command]) {
			setInputFields(inputCommands[command]);
			setPendingCommand(command);
			setShowInputDialog(true);
		} else {
			// Execute command directly
			executeCommand(command);
			// Keep options panel visible
		}
	};

	// Tools click handler (from toolbar icon)
	const handleToolsClick = () => {
		// Generate current context options and inject as a tools message
		const tools = generateOptions();
		if (tools?.length) {
			addToolsMessage(tools);
		}
		// After first injection, hide persistent options panel to reduce duplication
		if (showOptions) setShowOptions(false);
	};

	// Input dialog submit handler
	const handleInputSubmit = (inputs) => {
		if (pendingCommand) {
			executeCommand(pendingCommand, inputs);

			// Display inputs in chat
			addMessage(`${pendingCommand.split(".")[1]} with details:`, "user");
			Object.entries(inputs).forEach(([key, value]) => {
				if (
					value &&
					!key.toLowerCase().includes("password") &&
					!key.toLowerCase().includes("key")
				) {
					const fieldCfg = inputFields[key];
					const label =
						typeof fieldCfg === "string"
							? fieldCfg
							: fieldCfg.label;
					addMessage(`${label}: ${value}`, "user", false);
				}
			});
		}

		setShowInputDialog(false);
		setInputFields(null);
		setPendingCommand(null);
		// Keep options panel visible
	};

	// Input dialog cancel handler
	const handleInputCancel = () => {
		addMessage("Operation cancelled.", "bot");
		setShowInputDialog(false);
		setInputFields(null);
		setPendingCommand(null);
	};

	// Download manual handler
	const handleDownloadManual = () => {
		postMessage({ type: "downloadManual" });
		addMessage("Downloading user manual...", "bot");
	};

	// Settings handler
	const handleSettings = () => {
		setShowSettings(true);
	};

	// Message sending handler for LLM chat
	const handleSendMessage = async (message) => {
		// Add user message to chat
		addMessage(message, "user");

		// Send message to LLM via extension
		postMessage({
			type: "sendToLLM",
			message: message,
			model: currentModel, // extension will choose default if null
			timestamp: Date.now(),
		});

		// Show a temporary "thinking" message
		addMessage("Processing your request...", "bot");
	};

	return (
		<div className="semoss-chatbot-app">
			<div className="chat-container">
				<ChatHeader
					onClear={clearChat}
					onDownloadManual={handleDownloadManual}
					onSettings={handleSettings}
					isVisible={chatStarted}
					hasMessages={chatHistory.length > 0}
				/>

				<MessageList
					messages={chatHistory}
					viewport={viewport}
					isLoading={isLoading}
					onToolClick={handleOptionClick}
				/>

				<InteractionArea
					chatStarted={chatStarted}
					showOptions={false}
					options={currentOptions}
					onStart={handleStart}
					onOptionClick={handleOptionClick}
					onSendMessage={handleSendMessage}
					onToolsClick={handleToolsClick}
					viewport={viewport}
					currentInstance={currentInstance}
					instanceUrls={instanceUrls}
					isLoading={isLoading}
					onModelChange={setCurrentModel}
				/>
			</div>

			<InputDialog
				fields={inputFields}
				onSubmit={handleInputSubmit}
				onCancel={handleInputCancel}
				isVisible={showInputDialog}
			/>

			{/* Instance selection/removal dialog */}
			{instancesMode && instancesList && instancesList.length > 0 && (
				<div className="input-dialog-overlay">
					<div
						className={`input-dialog instance-dialog mode-${instancesMode}`}
					>
						<h3>
							{instancesMode === "select"
								? "Select an Instance"
								: "Remove an Instance"}
						</h3>
						<ul className="instance-list">
							{instancesList.map((inst) => (
								<li
									key={inst.alias}
									className={`instance-item ${currentInstance === inst.alias ? "current" : ""} ${pendingRemoval === inst.alias ? "pending" : ""}`}
								>
									<button
										type="button"
										onClick={() => {
											if (instancesMode === "select") {
												postMessage({
													type: "selectInstanceWebview",
													alias: inst.alias,
												});
											} else {
												// two-click confirm for removal
												if (
													pendingRemoval ===
													inst.alias
												) {
													postMessage({
														type: "removeInstanceWebview",
														alias: inst.alias,
													});
													setPendingRemoval(null);
												} else {
													setPendingRemoval(
														inst.alias,
													);
												}
											}
										}}
									>
										<strong>{inst.alias}</strong>
										<br />
										<span className="url">
											{inst.semossUrl}
										</span>
										{instancesMode === "remove" &&
											pendingRemoval === inst.alias && (
												<em
													style={{
														display: "block",
														marginTop: 4,
														color: "#ffb347",
														fontSize: "0.7rem",
													}}
												>
													Click again to confirm
													removal
												</em>
											)}
									</button>
								</li>
							))}
						</ul>
						<button
							className="close-dialog"
							type="button"
							onClick={() => {
								// clearing handled by sending empty mode
								postMessage({ type: "clearInstancesMode" });
								setPendingRemoval(null);
							}}
						>
							Cancel
						</button>
					</div>
				</div>
			)}

			<SettingsManager
				isOpen={showSettings}
				onClose={() => setShowSettings(false)}
			/>
		</div>
	);
};

export default SemossChatbotApp;
