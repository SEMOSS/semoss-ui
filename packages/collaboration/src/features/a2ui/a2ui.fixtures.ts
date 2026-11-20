/** Synthetic request shared by the protocol and interaction checks. */
export const a2uiRequest = {
	title: "Choose the next task",
	messages: [
		{
			version: "1.0",
			createSurface: {
				surfaceId: "task-choice",
				catalogId: "urn:semoss:collaboration:a2ui:1",
				dataModel: { notes: "" },
				components: [
					{
						id: "root",
						component: "Column",
						children: ["intro", "notes", "continue"],
					},
					{
						id: "intro",
						component: "Text",
						text: "Add context for the next task.",
					},
					{
						id: "notes",
						component: "TextField",
						label: "Additional context",
						value: { "@path": "/notes" },
					},
					{
						id: "continue",
						component: "Button",
						child: "continue_label",
						variant: "primary",
						action: {
							event: {
								name: "prepare",
								context: { notes: { "@path": "/notes" } },
							},
						},
					},
					{
						id: "continue_label",
						component: "Text",
						text: "Prepare task",
					},
				],
			},
		},
	],
};
