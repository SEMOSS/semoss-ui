import Gliner from "@/assets/img/Gliner.png";
import Detoxify from "@/assets/img/Detoxify.png";
export const GUARDRAIL_CONNECTION = {
    description: {
		General:
			"Basic information about the storage catalog such as name, description, tags, type of storage, and high-level metadata.",
		Settings:
			"Configure your storage provider, index structure, dimensionality, and similarity metric to optimize retrieval accuracy and performance.",
		Credentials:
			"Provide your storage API key or connection details to securely enable indexing and search operations.",
	},
    	GUARDRAIL: [
			{
				name: "Gliner",
				disable: false,
				icon: Gliner,
				fields: [
					{
						key: "NAME",
						label: "Catalog Name",
						value: "",
						component: "text",
						disabled: false,
						required: true,
                        category: "General",
					},
					{
						key: "NER_LABELS",
						label: "NER Labels",
						value: "",
						component: "text",
						disabled: false,
						required: false,
                        category: "General",
					},
					{
						key: "DEFAULT_THRESHOLD",
						label: "Default Threshold",
						value: "",
						component: "text",
						disabled: false,
						required: false,
                        category: "Settings",
					},
					{
						key: "GUARDRAIL_TYPE",
						label: "Guardrail Type",
						value: "EMBEDDED_GLINER",
						component: "text",
						disabled: true,
						required: false,
                        category: "Settings",
					},
					{
						key: "MODEL_NAME",
						label: "Model Name",
						value: "GPT-4o",
						component: "text",
						disabled: true,
						required: false,
                        category: "Settings",
					},
				],
			},
			{
				name: "Detoxify",
				disable: false,
				icon: Detoxify,
				fields: [
					{
						key: "NAME",
						label: "Catalog Name",
						value: "",
						component: "text",
						disabled: false,
						required: true,
                        category: "General",
					},
					{
						key: "DEFAULT_THRESHOLD",
						label: "DEFAULT THRESHOLD",
						value: "",
						component: "text",
						disabled: false,
						required: false,
                        category: "Settings",
					},
					{
						key: "GUARDRAIL_TYPE",
						label: "Guardrail Type",
						value: "EMBEDDED_DETOXIFY",
						component: "text",
						disabled: true,
						required: false,
                        category: "Settings",
					},
					{
						key: "MODEL_NAME",
						label: "Model Name",
						value: "GPT-4o",
						component: "text",
						disabled: true,
						required: false,
                        category: "Settings",
					},
				],
			},
        ],
}