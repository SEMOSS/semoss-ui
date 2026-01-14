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

const MCPManager = ({ isOpen, onClose }) => {
	// Server definitions persisted via configManager (mcpServers array)
	const [servers, setServers] = useState([]);
	const [isAddingServer, setIsAddingServer] = useState(false);
	const [editingServer, setEditingServer] = useState(null);
	const [deleteConfirmation, setDeleteConfirmation] = useState(null);

	useEffect(() => {
		const loadMCPData = async () => {
			const config = configManager.getConfig();
			setServers(config.mcpServers || []);
		};

		if (isOpen) loadMCPData();
	}, [isOpen]);

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
				/>
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
		url: server?.url || "",
		method: server?.method || "POST",
		headers: server?.headers || {},
	});

	const [argsText, setArgsText] = useState(server?.args?.join(" ") || "");
	const [envVars, setEnvVars] = useState(
		Object.entries(server?.env || {}).map(([key, value]) => ({
			key,
			value,
		})),
	);
	const [headerVars, setHeaderVars] = useState(
		Object.entries(server?.headers || {}).map(([key, value]) => ({
			key,
			value,
		})),
	);
	const [tools, setTools] = useState(
		server?.tools?.map(tool => ({
			...tool,
			parameters: tool.parameters ? JSON.stringify(tool.parameters, null, 2) : ""
		})) || [
			{ name: "", command: "", description: "", parameters: "" },
		],
	);
	const [formError, setFormError] = useState("");

	const addTool = () => {
		setTools([
			...tools,
			{ name: "", command: "", description: "", parameters: "" },
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

	const addHeaderVar = () => {
		setHeaderVars([...headerVars, { key: "", value: "" }]);
	};

	const removeHeaderVar = (index) => {
		setHeaderVars(headerVars.filter((_, i) => i !== index));
	};

	const updateHeaderVar = (index, field, value) => {
		const updated = headerVars.map((header, i) =>
			i === index ? { ...header, [field]: value } : header,
		);
		setHeaderVars(updated);
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
			.map((tool) => {
				const toolData = {
					name: tool.name.trim(),
					command: tool.command.trim(),
					description: tool.description.trim() || `Execute ${tool.name}`,
				};
				
				// Parse parameters if provided
				if (tool.parameters && tool.parameters.trim()) {
					try {
						toolData.parameters = JSON.parse(tool.parameters);
					} catch (e) {
						console.warn(`Invalid JSON in parameters for tool ${tool.name}:`, e);
					}
				}
				
				return toolData;
			});

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

		const headersObject = headerVars.reduce((acc, { key, value }) => {
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
			url: formData.url || undefined,
			method: formData.method || undefined,
			headers: Object.keys(headersObject).length > 0 ? headersObject : undefined,
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
						<textarea
							value={argsText}
							onChange={(e) => setArgsText(e.target.value)}
							placeholder="e.g., @modelcontextprotocol/server-filesystem /workspace"
							rows="3"
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
						<label>URL</label>
						<input
							type="text"
							value={formData.url}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									url: e.target.value,
								}))
							}
							placeholder="e.g., http://localhost:9090/Monolith/api/ext/mcp/..."
						/>
					</div>

					<div className="form-group">
						<label>Method</label>
						<select
							value={formData.method}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									method: e.target.value,
								}))
							}
						>
							<option value="GET">GET</option>
							<option value="POST">POST</option>
							<option value="PUT">PUT</option>
							<option value="DELETE">DELETE</option>
						</select>
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
					<h4>Headers</h4>
					<p className="form-help">
						Optional headers for Semoss-based MCP servers
					</p>

					{headerVars.map((headerVar, index) => (
						<div key={index} className="env-var-row">
							<input
								type="text"
								placeholder="Header name (e.g., Content-Type)"
								value={headerVar.key}
								onChange={(e) =>
									updateHeaderVar(index, "key", e.target.value)
								}
							/>
							<input
								type="text"
								placeholder="Header value"
								value={headerVar.value}
								onChange={(e) =>
									updateHeaderVar(index, "value", e.target.value)
								}
							/>
							<button
								id="headerremoveBtn"
								type="button"
								onClick={() => removeHeaderVar(index)}
								className="remove-button"
								disabled={headerVars.length === 1}
							>
								🗑️
							</button>
						</div>
					))}

					<button
						type="button"
						onClick={addHeaderVar}
						className="add-button"
					>
						+ Add Header
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
								<label>Parameters (Optional JSON)</label>
								<textarea
									value={tool.parameters || ""}
									onChange={(e) =>
										updateTool(
											index,
											"parameters",
											e.target.value,
										)
									}
									placeholder='{\n  "type": "object",\n  "properties": {\n    "param1": {\n      "type": "string",\n      "description": "..."\n    }\n  }\n}'
									rows="6"
								/>
								<small style={{ color: '#888', fontSize: '0.85em' }}>
									For Semoss-related servers, define tool parameters in JSON format
								</small>
							</div>
						</div>							<button
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

export default MCPManager;
