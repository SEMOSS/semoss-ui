import * as vscode from "vscode";
import { updateStatusBar } from "./statusBar.js";

/**
 * Get user input through VS Code input box
 * @param {string} prompt - The prompt to show to the user
 * @param {string} placeholder - Placeholder text for the input box
 * @returns {Promise<string>} The user input
 */
export async function getUserInput(prompt, placeholder = "") {
	return await vscode.window.showInputBox({
		prompt,
		ignoreFocusOut: true,
		placeHolder: placeholder,
	});
}

/**
 * Get all stored instances
 * @param {vscode.ExtensionContext} context - The extension context
 * @returns {Promise<Object>} Object containing all stored instances
 */
export async function getStoredInstances(context) {
	const instancesJson =
		(await context.secrets.get("SEMOSS_INSTANCES")) || "{}";
	try {
		return JSON.parse(instancesJson);
	} catch (error) {
		return {};
	}
}

/**
 * Store a new instance with alias
 * @param {vscode.ExtensionContext} context - The extension context
 * @param {string} alias - The alias for the instance
 * @param {Object} instanceData - The instance data
 */
export async function storeInstance(context, alias, instanceData) {
	const instances = await getStoredInstances(context);
	instances[alias] = instanceData;
	await context.secrets.store("SEMOSS_INSTANCES", JSON.stringify(instances));
}

/**
 * Store secrets in the VS Code keychain with alias support
 * @param {vscode.ExtensionContext} context - The extension context
 */
export async function storeSecrets(context) {
	const instances = await getStoredInstances(context);
	const existingAliases = Object.keys(instances);

	// Show existing instances if any
	if (existingAliases.length > 0) {
		const message = `Existing instances: ${existingAliases.join(", ")}`;
		vscode.window.showInformationMessage(message);
	}

	const alias = await getUserInput(
		"Enter an alias for this Semoss instance:",
		"e.g., Production, Development, Staging",
	);

	if (!alias) {
		vscode.window.showErrorMessage("Alias is required");
		return;
	}

	// Check if alias already exists
	if (instances[alias]) {
		const overwrite = await vscode.window.showQuickPick(["Yes", "No"], {
			placeHolder: `Instance "${alias}" already exists. Overwrite?`,
		});

		if (overwrite !== "Yes") {
			return;
		}
	}

	const semossUrl = await getUserInput(
		"Enter Semoss Instance URL (Before /SemossWeb):",
		"https://your-semoss-instance.com",
	);
	const accessKey = await getUserInput(
		"Enter Access Key:",
		"Your access key",
	);
	const privateKey = await getUserInput(
		"Enter Private Key:",
		"Your private key",
	);

	if (!semossUrl || !accessKey || !privateKey) {
		vscode.window.showErrorMessage("All fields are required");
		return;
	}

	// Store the instance
	await storeInstance(context, alias, {
		semossUrl,
		accessKey,
		privateKey,
	});

	// Set as current instance
	await context.secrets.store("CURRENT_INSTANCE_ALIAS", alias);

	// Update status bar
	await updateStatusBar(context);

	vscode.window.showInformationMessage(
		`Instance "${alias}" saved successfully!`,
	);
}

/**
 * Select an instance from stored instances
 * @param {vscode.ExtensionContext} context - The extension context
 * @returns {Promise<boolean>} True if an instance was selected
 */
export async function selectInstance(context) {
	const instances = await getStoredInstances(context);
	const aliases = Object.keys(instances);

	if (aliases.length === 0) {
		vscode.window.showWarningMessage(
			"No stored instances found. Please authorize a new instance first.",
		);
		return false;
	}

	const items = aliases.map((alias) => ({
		label: alias,
		description: instances[alias].semossUrl,
		detail: `Access Key: ${instances[alias].accessKey.substring(0, 8)}...`,
	}));

	const selected = await vscode.window.showQuickPick(items, {
		placeHolder: "Select a Semoss instance",
	});

	if (selected) {
		await context.secrets.store("CURRENT_INSTANCE_ALIAS", selected.label);
		await updateStatusBar(context);
		vscode.window.showInformationMessage(
			`Switched to instance: ${selected.label}`,
		);
		return true;
	}

	return false;
}

/**
 * Get current instance secrets
 * @param {vscode.ExtensionContext} context - The extension context
 * @returns {Promise<{accessKey: string, privateKey: string, semossUrl: string, alias: string} | null>} The current instance secrets
 */
export async function getCurrentInstance(context) {
	const currentAlias = await context.secrets.get("CURRENT_INSTANCE_ALIAS");

	if (!currentAlias) {
		return null;
	}

	const instances = await getStoredInstances(context);
	const instance = instances[currentAlias];

	if (!instance) {
		return null;
	}

	return {
		alias: currentAlias,
		accessKey: instance.accessKey,
		privateKey: instance.privateKey,
		semossUrl: instance.semossUrl,
	};
}

/**
 * Get secrets from the VS Code keychain (backward compatibility)
 * @param {vscode.ExtensionContext} context - The extension context
 * @returns {Promise<{accessKey: string, privateKey: string, semossUrl: string, alias: string} | null>} The secrets
 */
export async function getSecrets(context) {
	// First try to get current instance
	const currentInstance = await getCurrentInstance(context);
	if (currentInstance) {
		return currentInstance;
	}

	// Fallback to old storage method for backward compatibility
	const accessKey = await context.secrets.get("ACCESS_KEY");
	const privateKey = await context.secrets.get("PRIVATE_KEY");
	const semossUrl = await context.secrets.get("SEMOSS_URL");

	if (accessKey && privateKey && semossUrl) {
		// Migrate old storage to new format
		const alias = "Default";
		await storeInstance(context, alias, {
			semossUrl,
			accessKey,
			privateKey,
		});
		await context.secrets.store("CURRENT_INSTANCE_ALIAS", alias);

		// Update status bar after migration
		await updateStatusBar(context);

		// Clean up old storage
		await context.secrets.delete("ACCESS_KEY");
		await context.secrets.delete("PRIVATE_KEY");
		await context.secrets.delete("SEMOSS_URL");

		return { alias, accessKey, privateKey, semossUrl };
	}

	return null;
}

/**
 * Remove a stored instance
 * @param {vscode.ExtensionContext} context - The extension context
 */
export async function removeInstance(context) {
	const instances = await getStoredInstances(context);
	const aliases = Object.keys(instances);

	if (aliases.length === 0) {
		vscode.window.showWarningMessage("No stored instances found.");
		return;
	}

	const items = aliases.map((alias) => ({
		label: alias,
		description: instances[alias].semossUrl,
	}));

	const selected = await vscode.window.showQuickPick(items, {
		placeHolder: "Select instance to remove",
	});

	if (selected) {
		const confirm = await vscode.window.showQuickPick(["Yes", "No"], {
			placeHolder: `Are you sure you want to remove "${selected.label}"?`,
		});

		if (confirm === "Yes") {
			delete instances[selected.label];
			await context.secrets.store(
				"SEMOSS_INSTANCES",
				JSON.stringify(instances),
			);

			// If this was the current instance, clear it
			const currentAlias = await context.secrets.get(
				"CURRENT_INSTANCE_ALIAS",
			);
			if (currentAlias === selected.label) {
				await context.secrets.delete("CURRENT_INSTANCE_ALIAS");
			}

			// Update the status bar to reflect the changes
			await updateStatusBar(context);

			vscode.window.showInformationMessage(
				`Instance "${selected.label}" removed successfully!`,
			);
		}
	}
}
