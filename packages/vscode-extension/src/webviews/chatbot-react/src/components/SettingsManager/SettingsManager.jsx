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
			
			// Request the raw file content from extension
			window.vscode?.postMessage({ type: "getConfig" });
			
			// Set a timeout in case the message doesn't arrive
			const timeoutId = setTimeout(() => {
				// Default to empty if no response
				setConfigContent("");
				setIsLoading(false);
			}, 1000);
			
			// Listen for the response
			const responseHandler = (event) => {
				const { data } = event;
				if (data && data.type === "configData") {
					clearTimeout(timeoutId);
					const rawConfig = data.config || "";
					
					// Check if config is essentially empty (only has comments or whitespace)
					const hasActualConfig = rawConfig && 
						rawConfig.split('\n').some(line => {
							const trimmed = line.trim();
							return trimmed && !trimmed.startsWith('#');
						});
					
					// Set to empty if no actual config, otherwise use the file content
					setConfigContent(hasActualConfig ? rawConfig : "");
					setIsLoading(false);
					window.removeEventListener("message", responseHandler);
				}
			};
			
			window.addEventListener("message", responseHandler);
			
		} catch (error) {
			console.error("Failed to load configuration:", error);
			setConfigContent("");
			setIsLoading(false);
		}
	};		loadConfig();
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

			<div className="config-examples">
				<h3>Configuration Examples</h3>
				
				<div className="example-section">
					<h4>Model Configuration Example</h4>
					<pre className="example-code">{`models:
  - name: GPT-4o-mini
    provider: openai
    model: model-id
    apiKey: your-api-key
    apiBase: http://localhost:9090/Monolith/api/model/openai
    roles:
      - chat
    capabilities:
      - tool_use
    enabled: true`}</pre>
				</div>

				<div className="example-section">
					<h4>MCP Server Configuration Examples</h4>
					
					<div className="example-subsection">
						<h5>Semoss-based MCP Server</h5>
						<pre className="example-code">{`mcpServers:
  - name: Date
    command: npx
    args: []
    timeout: 15000
    enabled: true
    url: http://localhost:9090/Monolith/api/ext/mcp/app-id/comms
    method: POST
    headers:
      Content-Type: application/json
      Authorization: Bearer your-token
    tools:
      - name: Date
        command: semoss_npx
        description: Get current date and time
        parameters:
          type: object
          properties:
            format:
              type: string
              description: Date format (e.g., 'DD-MM-YYYY')
          required: []`}</pre>
					</div>

					<div className="example-subsection">
						<h5>NPX-based MCP Server</h5>
						<pre className="example-code">{`mcpServers:
  - name: git
    command: npx
    args:
      - '@modelcontextprotocol/server-git'
    timeout: 5000
    enabled: true
    tools: []`}</pre>
					</div>
				</div>
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
