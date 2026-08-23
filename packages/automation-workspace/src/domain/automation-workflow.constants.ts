import type {
	AutomationNodeDefinition,
	AutomationPort,
	AutomationWorkflowNodeType,
} from "./automation-workflow.types";

const controlIn: AutomationPort = {
	id: "in",
	label: "In",
	kind: "control",
	direction: "input",
};
const controlOut: AutomationPort = {
	id: "out",
	label: "Next",
	kind: "control",
	direction: "output",
};
const textOut: AutomationPort = {
	id: "result",
	label: "Result",
	kind: "data",
	direction: "output",
	dataType: "unknown",
};
const engine = {
	type: "string" as const,
	label: "Engine",
	placeholder: "Choose an engine ID",
	required: true,
};

export const AUTOMATION_WORKFLOW_NODE_REGISTRY: readonly AutomationNodeDefinition[] =
	[
		{
			type: "trigger.start",
			label: "Start",
			description: "Begins this automation when it is triggered.",
			category: "trigger",
			defaultConfig: {},
			configSchema: {},
			inputs: [],
			outputs: [controlOut],
			defaultCodeMode: "generated",
		},
		{
			type: "database.query",
			label: "Query database",
			description: "Retrieve rows with a database query.",
			category: "database",
			defaultConfig: { engineId: "", query: "", limit: 50 },
			configSchema: {
				engineId: engine,
				query: { type: "code", label: "Query", required: true },
				limit: { type: "number", label: "Result limit", minimum: 1 },
			},
			inputs: [controlIn],
			outputs: [controlOut, textOut],
			defaultCodeMode: "generated",
		},
		{
			type: "database.insert",
			label: "Insert database rows",
			description: "Add records to a database table.",
			category: "database",
			defaultConfig: {
				engineId: "",
				query: "",
				commit: true,
			},
			configSchema: {
				engineId: engine,
				query: {
					type: "code",
					label: "Insert SQL",
					required: true,
				},
				commit: { type: "boolean", label: "Commit changes" },
			},
			inputs: [controlIn],
			outputs: [controlOut],
			defaultCodeMode: "generated",
		},
		{
			type: "database.update",
			label: "Update database rows",
			description: "Update matching records in a database table.",
			category: "database",
			defaultConfig: { engineId: "", query: "", commit: true },
			configSchema: {
				engineId: engine,
				query: {
					type: "code",
					label: "Update SQL",
					required: true,
				},
				commit: { type: "boolean", label: "Commit changes" },
			},
			inputs: [controlIn],
			outputs: [controlOut],
			defaultCodeMode: "generated",
		},
		{
			type: "model.chat",
			label: "Chat model",
			description: "Ask a language model to generate a response.",
			category: "model",
			defaultConfig: {
				engineId: "",
				systemPrompt: "",
				prompt: "",
			},
			configSchema: {
				engineId: engine,
				systemPrompt: {
					type: "textarea",
					label: "Instructions for the model",
				},
				prompt: {
					type: "textarea",
					label: "What should the model do?",
					required: true,
				},
			},
			inputs: [controlIn],
			outputs: [controlOut, textOut],
			defaultCodeMode: "generated",
		},
		{
			type: "model.embeddings",
			label: "Create embeddings",
			description: "Turn text into vectors for semantic search.",
			category: "model",
			defaultConfig: { engineId: "", text: "" },
			configSchema: {
				engineId: engine,
				text: {
					type: "textarea",
					label: "Text to embed",
					required: true,
				},
			},
			inputs: [controlIn],
			outputs: [controlOut, textOut],
			defaultCodeMode: "generated",
		},
		{
			type: "model.vision",
			label: "Analyze image",
			description: "Ask a vision model about an image.",
			category: "model",
			defaultConfig: { engineId: "", image: "", prompt: "" },
			configSchema: {
				engineId: engine,
				image: {
					type: "string",
					label: "Image path or URL",
					required: true,
				},
				prompt: { type: "textarea", label: "Question about the image" },
			},
			inputs: [controlIn],
			outputs: [controlOut, textOut],
			defaultCodeMode: "generated",
		},
		{
			type: "model.ner",
			label: "Extract entities",
			description:
				"Find people, places, and other named entities in text.",
			category: "model",
			defaultConfig: { engineId: "", text: "" },
			configSchema: {
				engineId: engine,
				text: {
					type: "textarea",
					label: "Text to analyze",
					required: true,
				},
			},
			inputs: [controlIn],
			outputs: [controlOut, textOut],
			defaultCodeMode: "generated",
		},
		...(["list", "read", "upload", "download", "delete"] as const).map(
			(operation) => ({
				type: `storage.${operation}` as AutomationWorkflowNodeType,
				label: `${operation[0].toUpperCase()}${operation.slice(1)} files`,
				description: `${operation[0].toUpperCase()}${operation.slice(1)} files in connected storage.`,
				category: "storage" as const,
				defaultConfig: { engineId: "", path: "", destination: "" },
				configSchema: {
					engineId: engine,
					path: {
						type: "string" as const,
						label: "File or folder path",
						required: operation !== "list",
					},
					destination: {
						type: "string" as const,
						label: "Destination",
						required:
							operation === "upload" || operation === "download",
					},
				},
				inputs: [controlIn],
				outputs: [controlOut, textOut],
				defaultCodeMode: "generated" as const,
			}),
		),
		...(["search", "add", "delete"] as const).map((operation) => ({
			type: `vector.${operation}` as AutomationWorkflowNodeType,
			label: `${operation[0].toUpperCase()}${operation.slice(1)} vectors`,
			description: `${operation[0].toUpperCase()}${operation.slice(1)} records in a vector database.`,
			category: "vector" as const,
			defaultConfig: { engineId: "", value: "" },
			configSchema: {
				engineId: engine,
				value: {
					type: "textarea" as const,
					label: operation === "search" ? "Search query" : "Records",
					required: true,
				},
			},
			inputs: [controlIn],
			outputs: [controlOut, textOut],
			defaultCodeMode: "generated" as const,
		})),
		{
			type: "function.execute",
			label: "Execute function",
			description: "Call a reusable function engine.",
			category: "function",
			defaultConfig: { engineId: "", arguments: "{}" },
			configSchema: {
				engineId: engine,
				arguments: {
					type: "textarea",
					label: "JSON arguments",
					required: true,
				},
			},
			inputs: [controlIn],
			outputs: [controlOut, textOut],
			defaultCodeMode: "generated",
		},
		{
			type: "agent.run",
			label: "Run agent",
			description: "Run a configured SEMOSS agent with a prompt.",
			category: "agent",
			defaultConfig: { workspaceId: "", command: "", wait: true },
			configSchema: {
				workspaceId: {
					type: "string",
					label: "Agent",
					required: true,
				},
				command: {
					type: "textarea",
					label: "Instruction",
					required: true,
				},
			},
			inputs: [controlIn],
			outputs: [controlOut, textOut],
			defaultCodeMode: "generated",
		},
		{
			type: "app.pixel",
			label: "Run app Pixel",
			description: "Run a Pixel command in an application.",
			category: "app",
			defaultConfig: { appId: "", pixel: "" },
			configSchema: {
				pixel: { type: "code", label: "Pixel command", required: true },
			},
			inputs: [controlIn],
			outputs: [controlOut, textOut],
			defaultCodeMode: "generated",
		},
		{
			type: "control.wait",
			label: "Wait",
			description: "Pause the automation before continuing.",
			category: "control",
			defaultConfig: { durationSeconds: 5 },
			configSchema: {
				durationSeconds: {
					type: "number",
					label: "Wait for (seconds)",
					required: true,
					minimum: 0,
				},
			},
			inputs: [controlIn],
			outputs: [controlOut],
			defaultCodeMode: "generated",
		},
		{
			type: "developer.python",
			label: "Python",
			description: "Run custom Python for advanced transformations.",
			category: "developer",
			defaultConfig: {},
			configSchema: {},
			inputs: [controlIn],
			outputs: [controlOut, textOut],
			defaultCodeMode: "custom",
		},
	];

export const AUTOMATION_WORKFLOW_NODE_TYPES: readonly AutomationWorkflowNodeType[] =
	AUTOMATION_WORKFLOW_NODE_REGISTRY.map((definition) => definition.type);
