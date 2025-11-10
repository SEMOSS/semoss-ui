import React, { useEffect, useState } from "react";
import { ConfigManager } from "../../utils/configManager";
import MCPManager from "../MCPManager/MCPManager";
import "./SettingsManager.css";

export const SettingsManager = ({ isOpen, onClose }) => {
	const [activeTab, setActiveTab] = useState("mcp");

	if (!isOpen) return null;

	return (
		<div className="settings-manager-overlay">
			<div className="settings-manager">
				<div className="settings-manager-header">
					<h2>Semoss Configuration</h2>
					<button
						type="button"
						className="close-button"
						onClick={onClose}
					>
						✕
					</button>
				</div>

				<div className="settings-manager-content">
					<div className="settings-tabs">
						<button
							type="button"
							className={`tab-button ${activeTab === "mcp" ? "active" : ""}`}
							onClick={() => setActiveTab("mcp")}
						>
							MCP Servers
						</button>
						<button
							type="button"
							className={`tab-button ${activeTab === "config" ? "active" : ""}`}
							onClick={() => setActiveTab("config")}
						>
							Configuration
						</button>
					</div>

					<div className="settings-tab-content">
						{activeTab === "mcp" && (
							<MCPManager isOpen={true} onClose={() => {}} />
						)}

						{activeTab === "config" && <ConfigurationEditor />}
					</div>
				</div>
			</div>
		</div>
	);
};

const ConfigurationEditor = () => {
	const [configContent, setConfigContent] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [status, setStatus] = useState(null); // {type:'success'|'error'|'info', message:string}
	const [isSaving, setIsSaving] = useState(false);
	const configManager = ConfigManager.getInstance();

	// Load the actual user configuration on component mount
	useEffect(() => {
		const handler = (event) => {
			const { data } = event;
			if (!data || !data.type) return;
			if (data.type === "configSaved") {
				setIsSaving(false);
				setStatus({
					type: data.success ? "success" : "error",
					message: data.success
						? "Configuration saved."
						: "Failed to save configuration.",
				});
				// Auto clear success after 4s
				if (data.success) {
					setTimeout(() => {
						setStatus((prev) =>
							prev && prev.type === "success" ? null : prev,
						);
					}, 4000);
				}
			}
			if (data.type === "configError") {
				setIsSaving(false);
				setStatus({
					type: "error",
					message: data.error || "Configuration error.",
				});
			}
		};
		window.addEventListener("message", handler);

		const loadConfig = async () => {
			try {
				setIsLoading(true);
				// Export the current configuration as YAML
				const yamlConfig = configManager.exportAsYaml();
				setConfigContent(yamlConfig);
			} catch (error) {
				console.error("Failed to load configuration:", error);
				// Fallback - request config from VS Code extension if local loading fails
				console.warn(
					"Local config loading failed, requesting from extension",
				);
				window.vscode?.postMessage({ type: "getConfig" });
				// Temporary placeholder while waiting for extension response
				setConfigContent(`# Loading configuration...
# If this persists, check the VS Code extension logs for errors`);
			} finally {
				setIsLoading(false);
			}
		};

		loadConfig();
		return () => window.removeEventListener("message", handler);
	}, [configManager]);

	const handleSave = async () => {
		setIsSaving(true);
		setStatus({ type: "info", message: "Saving configuration..." });
		try {
			await configManager.importFromYaml(configContent);
			// actual success/error handled by message listener
		} catch (error) {
			console.error("Failed to initiate save:", error);
			setIsSaving(false);
			setStatus({
				type: "error",
				message: `Failed to save: ${error.message}`,
			});
		}
	};

	const handleReset = () => {
		// Non-blocking confirmation pattern
		if (isSaving) return; // avoid during save
		setStatus({
			type: "info",
			message: "Reset to defaults (unsaved). Click Save to apply.",
		});
		const defaultYaml = `# Semoss Configuration File
# This file controls various aspects of your Semoss AI assistant

# LLM Models Configuration
models: []

# MCP (Model Context Protocol) Servers  
mcpServers:
  - name: "filesystem"
    command: "npx"
    args: ["@modelcontextprotocol/server-filesystem", "/workspace"]
    description: "File system access for reading and writing files"
    enabled: true

# Preferences
preferences:
  chat:
    defaultModel: ""
    autoSave: true
    persistHistory: true
    maxHistoryLength: 1000
    enableTypingIndicator: true
  ui:
    theme: "auto"
    fontSize: 14
    fontFamily: "Segoe UI"
    showLineNumbers: true
    wordWrap: true
  code:
    autoComplete: true
    syntaxHighlighting: true
    enableInlineChat: true
    defaultLanguage: "javascript"

# Shortcuts
shortcuts:
  openChat: "Ctrl+Shift+L"
  clearChat: "Ctrl+K"
  openSettings: "Ctrl+,"
  toggleModel: "Ctrl+M"
  executeCommand: "Enter"
  multilineInput: "Shift+Enter"`;
		setConfigContent(defaultYaml);
	};

	if (isLoading) {
		return (
			<div className="config-editor">
				<div className="config-editor-header">
					<h3>YAML Configuration Editor</h3>
				</div>
				<div className="config-editor-content">
					<div style={{ padding: "20px", textAlign: "center" }}>
						Loading configuration...
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="config-editor">
			<div className="config-editor-header">
				<h3>YAML Configuration Editor</h3>
			</div>

			<div className="config-editor-content">
				<textarea
					className="config-textarea"
					value={configContent}
					onChange={(e) => setConfigContent(e.target.value)}
					placeholder="Enter your YAML configuration here..."
					spellCheck={false}
				/>
			</div>

			<div className="config-editor-footer">
				<p className="config-note">
					<strong>Note:</strong> Use environment variables like{" "}
					<code>$OPENAI_API_KEY</code> for sensitive information.
					Changes will be applied when you click Save.
				</p>
			</div>
			<div className="config-actions">
				{status && (
					<div
						className={`config-status config-status-${status.type}`}
						role="status"
					>
						{status.message}
					</div>
				)}
				<button
					type="button"
					className="save-button"
					onClick={handleSave}
					disabled={isSaving}
				>
					{isSaving ? "Saving..." : "Save Configuration"}
				</button>
			</div>
		</div>
	);
};

export default SettingsManager;
