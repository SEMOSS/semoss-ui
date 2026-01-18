import React, { useEffect, useState } from "react";
import { configManager } from "../../utils/configManager";
import "./MCPManager.css";

/**
 * MCPManager
 * UI for managing Model Context Protocol (MCP) servers plus their tools/resources.
 * - Lists configured servers (enable/disable, edit, delete)
 * - Allows adding new server definitions
 * - Displays mock tools/resources (placeholder until live integration)
 */
// Common MCP server templates with tools
const MCP_SERVER_TEMPLATES = {
	filesystem: {
		name: "filesystem",
		command: "npx",
		args: ["@modelcontextprotocol/server-filesystem", "/workspace"],
		description: "File system access for reading and writing files",
		enabled: true,
		tools: [
			{
				name: "read_file",
				command: 'cat "{{file_path}}"',
				description: "Read contents of a file",
				timeout: 5000,
			},
			{
				name: "list_directory",
				command: 'ls -la "{{directory_path}}"',
				description: "List directory contents with details",
				timeout: 5000,
			},
		],
	},
	git: {
		name: "git",
		command: "npx",
		args: ["@modelcontextprotocol/server-git"],
		description: "Git repository operations",
		enabled: true,
		tools: [
			{
				name: "git_status",
				command: "git status",
				description:
					"Get git repository status and working tree changes",
				timeout: 5000,
			},
			{
				name: "git_log",
				command: "git log --oneline -10",
				description: "Show recent commit history",
				timeout: 5000,
			},
		],
	},
	docker: {
		name: "docker",
		command: "docker",
		args: [],
		description: "Docker container management",
		enabled: true,
		tools: [
			{
				name: "list_containers",
				command: "docker ps -a",
				description: "List all Docker containers",
				timeout: 10000,
			},
			{
				name: "container_logs",
				command: "docker logs {{container_id}}",
				description: "Get logs for a specific container",
				timeout: 15000,
			},
		],
	},
	system: {
		name: "system",
		command: "powershell",
		args: [],
		description: "System information and monitoring",
		enabled: true,
		tools: [
			{
				name: "disk_usage",
				command:
					'Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, @{Name="Size(GB)";Expression={[math]::Round($_.Size/1GB,2)}}, @{Name="FreeSpace(GB)";Expression={[math]::Round($_.FreeSpace/1GB,2)}} | Format-Table',
				description: "Show disk usage for all drives",
				timeout: 5000,
			},
			{
				name: "running_processes",
				command:
					"Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 Name, CPU, WorkingSet | Format-Table",
				description: "Show top 10 processes by CPU usage",
				timeout: 5000,
			},
		],
	},
	nodejs: {
		name: "nodejs",
		command: "npm",
		args: [],
		description: "Node.js project development tools",
		enabled: true,
		tools: [
			{
				name: "run_tests",
				command: "npm test",
				description: "Run the project test suite",
				timeout: 30000,
			},
			{
				name: "build_project",
				command: "npm run build",
				description: "Build the project for production",
				timeout: 60000,
			},
		],
	},
};

const MCPManager = ({ isOpen, onClose }) => {
	// Server definitions persisted via configManager (mcpServers array)
	const [servers, setServers] = useState([]);
	const [tools, setTools] = useState([]);
	const [resources, setResources] = useState([]);
	const [activeTab, setActiveTab] = useState("servers");
	const [isAddingServer, setIsAddingServer] = useState(false);
	const [editingServer, setEditingServer] = useState(null);
	const [showTemplates, setShowTemplates] = useState(false);
	const [deleteConfirmation, setDeleteConfirmation] = useState(null);

	useEffect(() => {
		const loadMCPData = async () => {
			const config = configManager.getConfig();
			setServers(config.mcpServers || []);
			// Placeholder: simulate querying active MCP servers for tools/resources
			loadToolsAndResources();
		};

		if (isOpen) loadMCPData();
	}, [isOpen]);

	const loadToolsAndResources = async () => {
		// Demo data; replace with real server capability queries
		setTools([
			{
				name: "read_file",
				description: "Read the contents of a file",
				inputSchema: {
					type: "object",
					properties: {
						path: {
							type: "string",
							description: "Path to the file",
						},
					},
					required: ["path"],
				},
				server: "filesystem",
			},
			{
				name: "write_file",
				description: "Write content to a file",
				inputSchema: {
					type: "object",
					properties: {
						path: {
							type: "string",
							description: "Path to the file",
						},
						content: {
							type: "string",
							description: "Content to write",
						},
					},
					required: ["path", "content"],
				},
				server: "filesystem",
			},
		]);

		setResources([
			{
				uri: "file:///workspace/src/main.js",
				name: "main.js",
				description: "Main application file",
				mimeType: "application/javascript",
				server: "filesystem",
			},
		]);
	};

	const handleDeleteServer = (serverName) => {
		// Show custom confirmation dialog instead of window.confirm
		setDeleteConfirmation(serverName);
	};

	const confirmDeleteServer = async (serverName) => {
		try {
			const updated = servers.filter((s) => s.name !== serverName);
			setServers(updated);
			await configManager.updateConfig("mcpServers", updated);
			setDeleteConfirmation(null);
		} catch (error) {
			console.error("Error deleting server:", error);
			setDeleteConfirmation(null);
		}
	};

	const cancelDeleteServer = () => {
		setDeleteConfirmation(null);
	};

	const handleToggleServer = async (serverName) => {
		const updated = servers.map((s) =>
			s.name === serverName ? { ...s, enabled: !s.enabled } : s,
		);
		setServers(updated);
		await configManager.updateConfig("mcpServers", updated);
	};

	const handleSaveServer = async (server) => {
		const updated = editingServer
			? servers.map((s) => (s.name === editingServer.name ? server : s))
			: [...servers, server];
		setServers(updated);
		await configManager.updateConfig("mcpServers", updated);
		setIsAddingServer(false);
		setEditingServer(null);
	};

	const handleAddFromTemplate = async (templateKey) => {
		const template = MCP_SERVER_TEMPLATES[templateKey];
		if (!template) return;

		// Check if server with same name already exists
		const exists = servers.find((s) => s.name === template.name);
		if (exists) {
			alert(`MCP server "${template.name}" already exists!`);
			return;
		}

		const updated = [...servers, { ...template }];
		setServers(updated);
		await configManager.updateConfig("mcpServers", updated);
		setShowTemplates(false);
	};

	const handleEditServer = (server) => {
		setEditingServer(server);
		setIsAddingServer(true);
	};

	if (!isOpen) return null;

	return (
		<div className="mcp-manager-overlay">
			<div className="mcp-manager">
				<div className="mcp-manager-header">
					<h2>Model Context Protocol (MCP)</h2>
					<button
						type="button"
						className="close-button"
						onClick={onClose}
					>
						✕
					</button>
				</div>

				<div className="mcp-manager-content">
					<div className="mcp-tabs">
						<button
							type="button"
							className={`tab-button ${activeTab === "servers" ? "active" : ""}`}
							onClick={() => setActiveTab("servers")}
						>
							Servers ({servers.length})
						</button>
						<button
							type="button"
							className={`tab-button ${activeTab === "tools" ? "active" : ""}`}
							onClick={() => setActiveTab("tools")}
						>
							Tools ({tools.length})
						</button>
						<button
							type="button"
							className={`tab-button ${activeTab === "resources" ? "active" : ""}`}
							onClick={() => setActiveTab("resources")}
						>
							Resources ({resources.length})
						</button>
					</div>

					<div className="mcp-tab-content">
						{activeTab === "servers" && (
							<ServersTab
								servers={servers}
								isAddingServer={isAddingServer}
								editingServer={editingServer}
								setIsAddingServer={setIsAddingServer}
								setEditingServer={setEditingServer}
								onSaveServer={handleSaveServer}
								setServers={setServers}
								onEditServer={handleEditServer}
								onDeleteServer={handleDeleteServer}
								onToggleServer={handleToggleServer}
								showTemplates={showTemplates}
								setShowTemplates={setShowTemplates}
								onAddFromTemplate={handleAddFromTemplate}
							/>
						)}

						{activeTab === "tools" && (
							<ToolsTab tools={tools} servers={servers} />
						)}

						{activeTab === "resources" && (
							<ResourcesTab
								resources={resources}
								servers={servers}
							/>
						)}
					</div>
				</div>

				{/* Custom Delete Confirmation Dialog */}
				{deleteConfirmation && (
					<div className="confirmation-overlay">
						<div className="confirmation-dialog">
							<h3>Confirm Delete</h3>
							<p>
								Are you sure you want to delete MCP server "
								{deleteConfirmation}"?
							</p>
							<div className="confirmation-buttons">
								<button
									type="button"
									className="cancel-button"
									onClick={cancelDeleteServer}
								>
									Cancel
								</button>
								<button
									type="button"
									className="confirm-delete-button"
									onClick={() =>
										confirmDeleteServer(deleteConfirmation)
									}
								>
									Delete
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

const ServersTab = ({
	servers,
	isAddingServer,
	editingServer,
	setIsAddingServer,
	setEditingServer,
	onSaveServer,
	setServers,
	onEditServer,
	onDeleteServer,
	onToggleServer,
	showTemplates,
	setShowTemplates,
	onAddFromTemplate,
}) => {
	if (isAddingServer) {
		return (
			<ServerForm
				server={editingServer}
				onSave={onSaveServer}
				onCancel={() => {
					setIsAddingServer(false);
					setEditingServer(null);
				}}
			/>
		);
	}

	return (
		<div className="servers-tab">
			<div className="servers-header">
				<h3>MCP Servers</h3>
				<div className="server-actions">
					<button
						type="button"
						className="add-server-button secondary"
						onClick={() => setShowTemplates(!showTemplates)}
					>
						📋 Add from Template
					</button>
					<button
						type="button"
						className="add-server-button"
						onClick={() => {
							setIsAddingServer(true);
							setEditingServer(null);
						}}
					>
						+ Add Custom Server
					</button>
				</div>
			</div>

			{showTemplates && (
				<div className="server-templates">
					<h4>Common MCP Server Templates</h4>
					<div className="template-grid">
						{Object.entries(MCP_SERVER_TEMPLATES).map(
							([key, template]) => (
								<div key={key} className="template-card">
									<h5>{template.name}</h5>
									<p>{template.description}</p>
									<div className="template-details">
										<small>
											Command: {template.command}{" "}
											{template.args.join(" ")}
										</small>
									</div>
									<button
										type="button"
										className="template-add-button"
										onClick={() => onAddFromTemplate(key)}
									>
										Add {template.name}
									</button>
								</div>
							),
						)}
					</div>
				</div>
			)}

			<div className="servers-list">
				{servers.length === 0 ? (
					<div className="no-servers">
						<p>
							No MCP servers configured. Add your first server to
							enable external tools and resources.
						</p>
					</div>
				) : (
					servers.map((server) => (
						<ServerCard
							key={server.name}
							server={server}
							onEdit={() => onEditServer(server)}
							onDelete={() => onDeleteServer(server.name)}
							onToggle={() => onToggleServer(server.name)}
						/>
					))
				)}
			</div>
		</div>
	);
};

const ServerCard = ({ server, onEdit, onDelete, onToggle }) => {
	return (
		<div
			className={`server-card ${server.enabled ? "enabled" : "disabled"}`}
		>
			<div className="server-card-header">
				<div className="server-info">
					<h4>{server.name}</h4>
					<p className="server-command">
						{server.command} {server.args?.join(" ")}
					</p>
					{server.description && (
						<p className="server-description">
							{server.description}
						</p>
					)}
				</div>

				<div className="server-controls">
					<button
						type="button"
						className={`toggle-button ${server.enabled ? "enabled" : "disabled"}`}
						onClick={onToggle}
						title={
							server.enabled ? "Disable server" : "Enable server"
						}
					>
						{server.enabled ? "ON" : "OFF"}
					</button>

					<button
						type="button"
						className="edit-button"
						onClick={onEdit}
						title="Edit server"
					>
						✏️
					</button>

					<button
						type="button"
						className="delete-button"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							console.log("Delete button clicked directly");
							onDelete();
						}}
						title="Delete server"
					>
						🗑️
					</button>
				</div>
			</div>

			{server.env && Object.keys(server.env).length > 0 && (
				<div className="server-env">
					<h5>Environment Variables:</h5>
					<div className="env-vars">
						{Object.entries(server.env).map(([key, value]) => (
							<div key={key} className="env-var">
								<span className="env-key">{key}:</span>
								<span className="env-value">
									{value.includes("$") ? "••••••••" : value}
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

const ServerForm = ({ server, onSave, onCancel }) => {
	const [formData, setFormData] = useState({
		name: server?.name || "",
		command: server?.command || "",
		args: server?.args || [],
		description: server?.description || "",
		workingDirectory: server?.workingDirectory || "",
		timeout: server?.timeout || 5000,
		enabled: server?.enabled ?? true,
		env: server?.env || {},
	});

	const [argsText, setArgsText] = useState(server?.args?.join(" ") || "");
	const [envVars, setEnvVars] = useState(
		Object.entries(server?.env || {}).map(([key, value]) => ({
			key,
			value,
		})),
	);
	const [tools, setTools] = useState(
		server?.tools || [
			{ name: "", command: "", description: "", timeout: 5000 },
		],
	);
	const [formError, setFormError] = useState("");

	const addTool = () => {
		setTools([
			...tools,
			{ name: "", command: "", description: "", timeout: 5000 },
		]);
	};

	const removeTool = (index) => {
		if (tools.length > 1) {
			setTools(tools.filter((_, i) => i !== index));
		}
	};

	const updateTool = (index, field, value) => {
		const updatedTools = tools.map((tool, i) =>
			i === index ? { ...tool, [field]: value } : tool,
		);
		setTools(updatedTools);
	};

	const addEnvVar = () => {
		setEnvVars([...envVars, { key: "", value: "" }]);
	};

	const removeEnvVar = (index) => {
		setEnvVars(envVars.filter((_, i) => i !== index));
	};

	const updateEnvVar = (index, field, value) => {
		const updated = envVars.map((env, i) =>
			i === index ? { ...env, [field]: value } : env,
		);
		setEnvVars(updated);
	};

	const handleSubmit = (e) => {
		e.preventDefault();

		if (!formData.name || !formData.command) {
			setFormError("Please fill in all required fields.");
			return;
		}

		// Validate tools
		const validTools = tools
			.filter((tool) => tool.name.trim() && tool.command.trim())
			.map((tool) => ({
				name: tool.name.trim(),
				command: tool.command.trim(),
				description: tool.description.trim() || `Execute ${tool.name}`,
				timeout: parseInt(tool.timeout) || 5000,
			}));

		if (validTools.length === 0) {
			setFormError("Please add at least one tool with name and command.");
			return;
		}

		const envObject = envVars.reduce((acc, { key, value }) => {
			if (key.trim() && value.trim()) {
				acc[key.trim()] = value.trim();
			}
			return acc;
		}, {});

		const serverData = {
			name: formData.name,
			command: formData.command,
			args: argsText.trim() ? argsText.trim().split(/\s+/) : undefined,
			description: formData.description || undefined,
			workingDirectory: formData.workingDirectory || undefined,
			timeout: formData.timeout || undefined,
			enabled: formData.enabled,
			env: Object.keys(envObject).length > 0 ? envObject : undefined,
			tools: validTools,
		};

		onSave(serverData);
	};

	return (
		<div className="server-form">
			<h3>{server ? "Edit MCP Server" : "Add New MCP Server"}</h3>
			{formError && (
				<div className="config-status config-status-error" role="alert">
					{formError}
				</div>
			)}
			<form onSubmit={handleSubmit}>
				<div className="form-section">
					<h4>Basic Information</h4>

					<div className="form-group">
						<label>Server Name *</label>
						<input
							type="text"
							value={formData.name}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									name: e.target.value,
								}))
							}
							placeholder="e.g., filesystem"
							required
						/>
					</div>

					<div className="form-group">
						<label>Command *</label>
						<input
							type="text"
							value={formData.command}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									command: e.target.value,
								}))
							}
							placeholder="e.g., npx"
							required
						/>
					</div>

					<div className="form-group">
						<label>Arguments</label>
						<input
							type="text"
							value={argsText}
							onChange={(e) => setArgsText(e.target.value)}
							placeholder="e.g., @modelcontextprotocol/server-filesystem /workspace"
						/>
					</div>

					<div className="form-group">
						<label>Description</label>
						<input
							type="text"
							value={formData.description}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									description: e.target.value,
								}))
							}
							placeholder="Brief description of what this server provides"
						/>
					</div>

					<div className="form-group">
						<label>Working Directory</label>
						<input
							type="text"
							value={formData.workingDirectory}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									workingDirectory: e.target.value,
								}))
							}
							placeholder="Optional: custom working directory"
						/>
					</div>

					<div className="form-group">
						<label>Timeout (ms)</label>
						<input
							type="number"
							value={formData.timeout}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									timeout: parseInt(e.target.value) || 5000,
								}))
							}
							placeholder="5000"
							min="1000"
							max="300000"
						/>
					</div>

					<div className="form-group">
						<label className="checkbox-label">
							<input
								type="checkbox"
								checked={formData.enabled}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										enabled: e.target.checked,
									}))
								}
							/>
							Enable this server
						</label>
					</div>
				</div>

				<div className="form-section">
					<h4>Environment Variables</h4>
					<p className="form-help">
						Optional environment variables for this server
					</p>

					{envVars.map((envVar, index) => (
						<div key={index} className="env-var-row">
							<input
								type="text"
								placeholder="Variable name"
								value={envVar.key}
								onChange={(e) =>
									updateEnvVar(index, "key", e.target.value)
								}
							/>
							<input
								type="text"
								placeholder="Variable value"
								value={envVar.value}
								onChange={(e) =>
									updateEnvVar(index, "value", e.target.value)
								}
							/>
							<button
								type="button"
								onClick={() => removeEnvVar(index)}
								className="remove-button"
								disabled={envVars.length === 1}
							>
								🗑️
							</button>
						</div>
					))}

					<button
						type="button"
						onClick={addEnvVar}
						className="add-button"
					>
						+ Add Environment Variable
					</button>
				</div>

				<div className="form-section">
					<h4>Tools Configuration *</h4>
					<p className="form-help">
						Define the tools/commands this server provides
					</p>

					{tools.map((tool, index) => (
						<div key={index} className="tool-row">
							<div className="tool-fields">
								<div className="form-group">
									<label>Tool Name *</label>
									<input
										type="text"
										placeholder="e.g., git_status"
										value={tool.name}
										onChange={(e) =>
											updateTool(
												index,
												"name",
												e.target.value,
											)
										}
										required
									/>
								</div>

								<div className="form-group">
									<label>Command *</label>
									<input
										type="text"
										placeholder="e.g., git status"
										value={tool.command}
										onChange={(e) =>
											updateTool(
												index,
												"command",
												e.target.value,
											)
										}
										required
									/>
								</div>

								<div className="form-group">
									<label>Description</label>
									<input
										type="text"
										placeholder="What this tool does"
										value={tool.description}
										onChange={(e) =>
											updateTool(
												index,
												"description",
												e.target.value,
											)
										}
									/>
								</div>

								<div className="form-group">
									<label>Timeout (ms)</label>
									<input
										type="number"
										value={tool.timeout}
										onChange={(e) =>
											updateTool(
												index,
												"timeout",
												parseInt(e.target.value) ||
													5000,
											)
										}
										min="1000"
										max="300000"
									/>
								</div>
							</div>

							<button
								type="button"
								onClick={() => removeTool(index)}
								className="remove-tool-button"
								disabled={tools.length === 1}
								title="Remove this tool"
							>
								🗑️
							</button>
						</div>
					))}

					<button
						type="button"
						onClick={addTool}
						className="add-button"
					>
						+ Add Tool
					</button>
				</div>

				<div className="form-actions">
					<button
						type="button"
						className="cancel-button"
						onClick={onCancel}
					>
						Cancel
					</button>
					<button type="submit" className="save-button">
						{server ? "Update Server" : "Add Server"}
					</button>
				</div>
			</form>
		</div>
	);
};

const ToolsTab = ({ tools, servers }) => {
	const enabledServers = servers.filter((s) => s.enabled);

	return (
		<div className="tools-tab">
			<div className="tools-header">
				<h3>Available Tools</h3>
				<p>Tools provided by enabled MCP servers</p>
			</div>

			{enabledServers.length === 0 ? (
				<div className="no-tools">
					<p>
						No enabled MCP servers. Enable servers to see available
						tools.
					</p>
				</div>
			) : (
				<div className="tools-list">
					{tools.map((tool, index) => (
						<div
							key={`${tool.server}-${tool.name}-${index}`}
							className="tool-card"
						>
							<div className="tool-header">
								<h4>{tool.name}</h4>
								<span className="tool-server">
									from {tool.server}
								</span>
							</div>
							<p className="tool-description">
								{tool.description}
							</p>
							<div className="tool-schema">
								<h5>Input Schema:</h5>
								<pre>
									{JSON.stringify(tool.inputSchema, null, 2)}
								</pre>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

const ResourcesTab = ({ resources, servers }) => {
	const enabledServers = servers.filter((s) => s.enabled);

	return (
		<div className="resources-tab">
			<div className="resources-header">
				<h3>Available Resources</h3>
				<p>Resources provided by enabled MCP servers</p>
			</div>

			{enabledServers.length === 0 ? (
				<div className="no-resources">
					<p>
						No enabled MCP servers. Enable servers to see available
						resources.
					</p>
				</div>
			) : (
				<div className="resources-list">
					{resources.map((resource, index) => (
						<div
							key={`${resource.server}-${resource.uri}-${index}`}
							className="resource-card"
						>
							<div className="resource-header">
								<h4>{resource.name}</h4>
								<span className="resource-server">
									from {resource.server}
								</span>
							</div>
							<p className="resource-uri">{resource.uri}</p>
							{resource.description && (
								<p className="resource-description">
									{resource.description}
								</p>
							)}
							{resource.mimeType && (
								<span className="resource-mime-type">
									{resource.mimeType}
								</span>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default MCPManager;
