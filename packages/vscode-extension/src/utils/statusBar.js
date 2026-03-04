import * as vscode from "vscode";
import { getStoredInstances } from "./secrets.js";

let statusBarItem;

/**
 * Initialize the status bar item for Semoss instance display
 * @param {vscode.ExtensionContext} context - The extension context
 * @returns {vscode.StatusBarItem} The created status bar item
 */
export function initStatusBar(context) {
	statusBarItem = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Left,
		100,
	);
	statusBarItem.command = "semoss.selectInstance"; // Make it clickable to change instance
	context.subscriptions.push(statusBarItem);
	return statusBarItem;
}

/**
 * Update the status bar with current instance information
 * @param {vscode.ExtensionContext} context - The extension context
 */
export async function updateStatusBar(context) {
	if (!statusBarItem) {
		statusBarItem = initStatusBar(context);
	}

	const currentAlias = await context.secrets.get("CURRENT_INSTANCE_ALIAS");
	const instances = await getStoredInstances(context);

	// Check if we have any instances at all
	const hasInstances = Object.keys(instances).length > 0;

	if (currentAlias && instances[currentAlias]) {
		const instance = instances[currentAlias];
		statusBarItem.text = "$(server) Semoss: " + currentAlias;
		statusBarItem.tooltip =
			"Current Semoss Instance: " +
			currentAlias +
			" (" +
			instance.semossUrl +
			")";
		statusBarItem.show();
	} else if (hasInstances) {
		// We have instances but none selected
		statusBarItem.text = "$(server) Semoss: Select Instance";
		statusBarItem.tooltip = "Click to select a Semoss instance";
		statusBarItem.show();
	} else {
		// No instances configured
		statusBarItem.text = "$(server) Semoss: Not Connected";
		statusBarItem.tooltip = "Click to add a Semoss instance";
		statusBarItem.show();
	}
}
