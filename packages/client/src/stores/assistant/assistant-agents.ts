import type { AssistantAgent } from "./assistant.store";

/** Built-in workbench agents registered by the backend's SystemAgentSeeder. */
export const APP_BUILDER_AGENT: AssistantAgent = {
	workspace_id: "app-builder",
	name: "App Building Agent",
};

export const DATABASE_EXPLORER_AGENT: AssistantAgent = {
	workspace_id: "database-explorer",
	name: "Database Explorer",
};

export const NOTEBOOK_ANALYST_AGENT: AssistantAgent = {
	workspace_id: "notebook-analyst",
	name: "Notebook Analyst",
};

export const AUTOMATION_BUILDER_AGENT: AssistantAgent = {
	workspace_id: "workflow-automation-builder",
	name: "Automation Building Agent",
};
