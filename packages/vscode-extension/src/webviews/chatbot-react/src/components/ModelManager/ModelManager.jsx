import React, { useEffect, useId, useState } from "react";
import { MODEL_PROVIDERS } from "../../types/config";
import { configManager } from "../../utils/configManager";
import "./ModelManager.css";

/**
 * ModelManager UI
 * - List, enable/disable, edit, delete configured LLM models
 * - Add new model definitions referencing provider catalog (MODEL_PROVIDERS)
 * Subcomponents: ModelCard (summary display) & ModelForm (create/update)
 */

export const ModelManager = ({ isOpen, onClose }) => {
	const [models, setModels] = useState([]);
	const [selectedProvider, setSelectedProvider] = useState("");
	const [isAddingModel, setIsAddingModel] = useState(false);
	const [editingModel, setEditingModel] = useState(null);

	useEffect(() => {
		const loadModels = async () => {
			const config = configManager.getConfig();
			setModels(config.models);
		};

		if (isOpen) {
			loadModels();
		}
	}, [isOpen]);

	const handleAddModel = () => {
		setIsAddingModel(true);
		setEditingModel(null);
	};

	const handleEditModel = (model) => {
		setEditingModel(model);
		setIsAddingModel(true);
		setSelectedProvider(model.provider);
	};

	const handleDeleteModel = async (modelName) => {
		const updatedModels = models.filter((m) => m.name !== modelName);
		setModels(updatedModels);
		await configManager.updateConfig("models", updatedModels);
	};

	const handleToggleModel = async (modelName) => {
		const updatedModels = models.map((m) =>
			m.name === modelName ? { ...m, enabled: !m.enabled } : m,
		);
		setModels(updatedModels);
		await configManager.updateConfig("models", updatedModels);
	};

	const handleSaveModel = async (model) => {
		let updatedModels;

		if (editingModel) {
			// Update existing model
			updatedModels = models.map((m) =>
				m.name === editingModel.name ? model : m,
			);
		} else {
			// Add new model
			updatedModels = [...models, model];
		}

		setModels(updatedModels);
		await configManager.updateConfig("models", updatedModels);
		setIsAddingModel(false);
		setEditingModel(null);
	};

	const handleCancelEdit = () => {
		setIsAddingModel(false);
		setEditingModel(null);
		setSelectedProvider("");
	};

	if (!isOpen) return null;

	return (
		<div className="model-manager-overlay">
			<div className="model-manager">
				<div className="model-manager-header">
					<h2>LLM Model Management</h2>
					<button className="close-button" onClick={onClose}>
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
						>
							<path
								d="M18 6L6 18M6 6l12 12"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</button>
				</div>

				<div className="model-manager-content">
					{!isAddingModel ? (
						<>
							<div className="models-list-header">
								<h3>Configured Models</h3>
								<button
									className="add-model-button"
									onClick={handleAddModel}
								>
									<svg
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
									>
										<path
											d="M12 5v14M5 12h14"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
									Add Model
								</button>
							</div>

							<div className="models-list">
								{models.length === 0 ? (
									<div className="no-models">
										<p>
											No models configured. Add your first
											model to get started.
										</p>
									</div>
								) : (
									models.map((model) => (
										<ModelCard
											key={model.name}
											model={model}
											onEdit={() =>
												handleEditModel(model)
											}
											onDelete={() =>
												handleDeleteModel(model.name)
											}
											onToggle={() =>
												handleToggleModel(model.name)
											}
										/>
									))
								)}
							</div>
						</>
					) : (
						<ModelForm
							model={editingModel}
							providers={MODEL_PROVIDERS}
							selectedProvider={selectedProvider}
							onProviderChange={setSelectedProvider}
							onSave={handleSaveModel}
							onCancel={handleCancelEdit}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

const ModelCard = ({ model, onEdit, onDelete, onToggle }) => {
	const provider = MODEL_PROVIDERS.find((p) => p.name === model.provider);

	return (
		<div className={`model-card ${model.enabled ? "enabled" : "disabled"}`}>
			<div className="model-card-header">
				<div className="model-info">
					<h4>{model.name}</h4>
					<p className="model-provider">
						{provider?.displayName || model.provider} •{" "}
						{model.model}
					</p>
				</div>

				<div className="model-controls">
					<button
						className={`toggle-button ${model.enabled ? "enabled" : "disabled"}`}
						onClick={onToggle}
						title={model.enabled ? "Disable model" : "Enable model"}
					>
						{model.enabled ? "ON" : "OFF"}
					</button>

					<button
						className="edit-button"
						onClick={onEdit}
						title="Edit model"
					>
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
						>
							<path
								d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
							<path
								d="m18.5 2.5 a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</button>

					<button
						className="delete-button"
						onClick={onDelete}
						title="Delete model"
					>
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
						>
							<path
								d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</button>
				</div>
			</div>

			<div className="model-card-details">
				<div className="model-setting">
					<span>Temperature:</span>
					<span>{model.temperature || 0.7}</span>
				</div>
				<div className="model-setting">
					<span>Max Tokens:</span>
					<span>{model.maxTokens || 4096}</span>
				</div>
				{model.apiKey && (
					<div className="model-setting">
						<span>API Key:</span>
						<span className="masked-key">
							••••••••{model.apiKey.slice(-4)}
						</span>
					</div>
				)}
			</div>
		</div>
	);
};

const ModelForm = ({
	model,
	providers,
	selectedProvider,
	onProviderChange,
	onSave,
	onCancel,
}) => {
	const [formData, setFormData] = useState({
		name: model?.name || "",
		provider: model?.provider || "openai",
		model: model?.model || "",
		apiKey: model?.apiKey || "",
		baseUrl: model?.baseUrl || "",
		temperature: model?.temperature || 0.7,
		maxTokens: model?.maxTokens || 4096,
		enabled: model?.enabled ?? true,
	});
	const [formError, setFormError] = useState("");

	const selectedProviderData = providers.find(
		(p) => p.name === selectedProvider,
	);

	useEffect(() => {
		if (selectedProvider && selectedProvider !== formData.provider) {
			setFormData((prev) => ({
				...prev,
				provider: selectedProvider,
				model: selectedProviderData?.models[0]?.id || "",
			}));
		}
	}, [selectedProvider, selectedProviderData, formData.provider]);

	const handleSubmit = (e) => {
		e.preventDefault();

		if (!formData.name || !formData.provider || !formData.model) {
			setFormError("Please fill in all required fields.");
			return;
		}

		onSave(formData);
	};

	return (
		<div className="model-form">
			<h3>{model ? "Edit Model" : "Add New Model"}</h3>
			{formError && (
				<div className="config-status config-status-error" role="alert">
					{formError}
				</div>
			)}
			<form onSubmit={handleSubmit}>
				<div className="form-section">
					<h4>Basic Information</h4>

					<div className="form-group">
						<label htmlFor="name">Model Name *</label>
						<input
							id="name"
							type="text"
							value={formData.name}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									name: e.target.value,
								}))
							}
							placeholder="e.g., gpt-4-turbo"
							required
						/>
					</div>

					<div className="form-group">
						<label htmlFor="provider">Provider *</label>
						<select
							id="provider"
							value={selectedProvider || formData.provider}
							onChange={(e) => onProviderChange(e.target.value)}
							required
						>
							<option value="">Select a provider</option>
							{providers.map((provider) => (
								<option
									key={provider.name}
									value={provider.name}
								>
									{provider.displayName}
								</option>
							))}
						</select>
					</div>

					{selectedProviderData && (
						<div className="form-group">
							<label htmlFor="model">Model *</label>
							<select
								id="model"
								value={formData.model}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										model: e.target.value,
									}))
								}
								required
							>
								<option value="">Select a model</option>
								{selectedProviderData.models.map((model) => (
									<option key={model.id} value={model.id}>
										{model.name} - {model.description}
									</option>
								))}
							</select>
						</div>
					)}
				</div>

				<div className="form-section">
					<h4>Configuration</h4>

					{selectedProviderData?.apiKeyRequired && (
						<div className="form-group">
							<label htmlFor="apiKey">
								API Key{" "}
								{selectedProviderData.apiKeyRequired ? "*" : ""}
							</label>
							<input
								id="apiKey"
								type="password"
								value={formData.apiKey}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										apiKey: e.target.value,
									}))
								}
								placeholder="Enter your API key"
								required={selectedProviderData.apiKeyRequired}
							/>
						</div>
					)}

					{selectedProviderData?.baseUrlRequired && (
						<div className="form-group">
							<label htmlFor="baseUrl">Base URL *</label>
							<input
								id="baseUrl"
								type="url"
								value={formData.baseUrl}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										baseUrl: e.target.value,
									}))
								}
								placeholder="http://localhost:11434"
								required
							/>
						</div>
					)}

					<div className="form-row">
						<div className="form-group">
							<label htmlFor="temperature">Temperature</label>
							<input
								id="temperature"
								type="number"
								min="0"
								max="2"
								step="0.1"
								value={formData.temperature}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										temperature: parseFloat(e.target.value),
									}))
								}
							/>
						</div>

						<div className="form-group">
							<label htmlFor="maxTokens">Max Tokens</label>
							<input
								id="maxTokens"
								type="number"
								min="1"
								max="32000"
								value={formData.maxTokens}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										maxTokens: parseInt(e.target.value),
									}))
								}
							/>
						</div>
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
							Enable this model
						</label>
					</div>
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
						{model ? "Update Model" : "Add Model"}
					</button>
				</div>
			</form>
		</div>
	);
};

export default ModelManager;
