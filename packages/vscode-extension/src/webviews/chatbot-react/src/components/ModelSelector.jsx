import React, { useEffect, useState } from "react";
import { configManager } from "../utils/configManager";

/**
 * Simple dropdown selector for enabled LLM models.
 * Replaces the previous complex ModelManager UI.
 */
const ModelSelector = ({ onChange }) => {
	const [models, setModels] = useState([]);
	const [selected, setSelected] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		let mounted = true;
		const load = async () => {
			try {
				// Ensure config is loaded (idempotent inside manager)
				await configManager.loadConfig?.(); // TS version has loadConfig method; guard in case already loaded
				const cfg = configManager.getConfig();
				const all = cfg.models || [];
				if (mounted) {
					setModels(all);
					const def = cfg?.preferences?.chat?.defaultModel;
					// Fallback to first enabled model or first model
					const initial =
						def && all.find((m) => m.name === def)
							? def
							: all.find((m) => m.enabled) !== undefined
								? all.find((m) => m.enabled).name
								: all[0]?.name || "";
					setSelected(initial);
					setLoading(false);
				}
			} catch (e) {
				console.error("Failed to load models", e);
				if (mounted) {
					setError("Failed to load models");
					setLoading(false);
				}
			}
		};

		// Listen for configuration updates from VS Code extension
		const handleMessage = (event) => {
			if (event.data.type === "configSaved" && event.data.success) {
				// Reload models when configuration is successfully saved
				load();
			}
		};

		// Add event listener for messages from VS Code
		if (typeof window !== "undefined") {
			window.addEventListener("message", handleMessage);
		}

		load();
		return () => {
			mounted = false;
			if (typeof window !== "undefined") {
				window.removeEventListener("message", handleMessage);
			}
		};
	}, []);

	const handleChange = async (e) => {
		const value = e.target.value;
		setSelected(value);
		try {
			const cfg = configManager.getConfig();
			// If the selected model is disabled, enable it
			const updatedModels = (cfg.models || []).map((m) =>
				m.name === value ? { ...m, enabled: true } : m,
			);
			const newPrefs = {
				...cfg.preferences,
				chat: {
					...cfg.preferences?.chat,
					defaultModel: value,
				},
			};
			await configManager.updateConfig("preferences", newPrefs);
			// Persist model enablement if changed
			await configManager.updateConfig("models", updatedModels);
			setModels(updatedModels);
		} catch (err) {
			console.warn("Could not persist selected model", err);
		}
		if (onChange) onChange(value);
	};

	if (loading) {
		return (
			<div style={{ fontSize: "12px", opacity: 0.7 }}>
				Loading models...
			</div>
		);
	}
	if (error) {
		return <div style={{ fontSize: "12px", color: "#f00" }}>{error}</div>;
	}
	if (!models.length) {
		return (
			<div style={{ fontSize: "12px", opacity: 0.7 }}>
				No models configured
			</div>
		);
	}

	return (
		<select
			aria-label="Select LLM model"
			value={selected}
			onChange={handleChange}
			style={{
				background: "#3c3c3c",
				color: "#ccc",
				border: "1px solid #3c3c3c",
				padding: "4px 8px",
				borderRadius: 4,
				fontSize: 12,
				maxWidth: 180,
			}}
		>
			{models.map((m) => (
				<option key={m.name} value={m.name}>
					{m.name}
					{m.enabled === false ? " (disabled)" : ""}
				</option>
			))}
		</select>
	);
};

export default ModelSelector;
