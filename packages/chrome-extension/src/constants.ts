// Constants used across the extension
export const ELEMENT_SELECTOR_ATTRIBUTE = "data-workshop-id";
export const MAX_ACTIONS = 50;
export const ACTION_DELAY = 1000; // ms between actions

// Workshop configuration - will be loaded from storage
export const WORKSHOP_CONFIG_KEYS = {
	ENDPOINT: "workshop_endpoint",
	MODULE: "workshop_module",
	APP_ID: "workshop_app_id",
};

// Available actions that LLM can use
export const AVAILABLE_ACTIONS = [
	{
		name: "click",
		description: "Click on an element",
		args: [{ name: "elementId", type: "number" }],
	},
	{
		name: "setValue",
		description: "Set the value of an input field",
		args: [
			{ name: "elementId", type: "number" },
			{ name: "value", type: "string" },
		],
	},
	{
		name: "wait",
		description: "Wait for a specified number of milliseconds",
		args: [{ name: "ms", type: "number" }],
	},
	{
		name: "done",
		description: "Mark the task as complete",
		args: [],
	},
];
