import { a2uiRequest } from "./a2ui.fixtures";
import { createA2uiProcessor } from "./a2ui-catalog";

it("loads protocol messages and keeps bound data isolated to the tool call", () => {
	const first = createA2uiProcessor(JSON.stringify(a2uiRequest), vi.fn());
	const second = createA2uiProcessor(JSON.stringify(a2uiRequest), vi.fn());
	try {
		const surface = first.processor.getSurface("task-choice");
		surface?.dataModel.set("/notes", "Review tomorrow");
		expect(surface?.dataModel.get("/notes")).toBe("Review tomorrow");
		expect(
			second.processor.getSurface("task-choice")?.dataModel.get("/notes"),
		).toBe("");
	} finally {
		first.processor.dispose();
		second.processor.dispose();
	}
});

it("applies an ordered data update", () => {
	const { processor } = createA2uiProcessor(
		JSON.stringify({
			...a2uiRequest,
			messages: [
				...a2uiRequest.messages,
				{
					version: "1.0",
					updateDataModel: {
						surfaceId: "task-choice",
						path: "/notes",
						value: "Updated",
					},
				},
			],
		}),
		vi.fn(),
	);
	try {
		expect(
			processor.getSurface("task-choice")?.dataModel.get("/notes"),
		).toBe("Updated");
	} finally {
		processor.dispose();
	}
});

it("accepts creation followed by a complete component update in the same batch", () => {
	const { components, ...createSurface } =
		a2uiRequest.messages[0].createSurface;
	const { processor } = createA2uiProcessor(
		JSON.stringify({
			title: "Example",
			messages: [
				{ version: "1.0", createSurface },
				{
					version: "1.0",
					updateComponents: {
						surfaceId: createSurface.surfaceId,
						components,
					},
				},
			],
		}),
		vi.fn(),
	);
	try {
		expect(
			processor
				.getSurface(createSurface.surfaceId)
				?.componentsModel.get("notes")?.type,
		).toBe("TextField");
	} finally {
		processor.dispose();
	}
});

it.each([
	[
		"custom catalog",
		{
			...a2uiRequest.messages[0].createSurface,
			catalogId: "https://example.com/custom.json",
		},
	],
	[
		"unregistered component",
		{
			...a2uiRequest.messages[0].createSurface,
			components: [
				{
					id: "root",
					component: "Image",
					url: "https://example.com/image",
				},
			],
		},
	],
	[
		"cycle",
		{
			...a2uiRequest.messages[0].createSurface,
			components: [
				{ id: "root", component: "Column", children: ["root"] },
			],
		},
	],
	[
		"missing child",
		{
			...a2uiRequest.messages[0].createSurface,
			components: [
				{ id: "root", component: "Column", children: ["missing"] },
			],
		},
	],
	[
		"function",
		{
			...a2uiRequest.messages[0].createSurface,
			components: [
				{
					id: "root",
					component: "Text",
					text: { "@call": "@eval", args: {} },
				},
			],
		},
	],
])("rejects an unsafe or invalid %s", (_name, createSurface) => {
	expect(() =>
		createA2uiProcessor(
			JSON.stringify({
				title: "Example",
				messages: [{ version: "1.0", createSurface }],
			}),
			vi.fn(),
		),
	).toThrow();
});

it("reads messages a model server handed over as JSON text", () => {
	const { processor } = createA2uiProcessor(
		JSON.stringify({
			...a2uiRequest,
			messages: JSON.stringify(a2uiRequest.messages),
		}),
		vi.fn(),
	);
	try {
		expect(processor.getSurface("task-choice")).toBeDefined();
	} finally {
		processor.dispose();
	}
});

it("tells the agent what to correct", () => {
	const original = a2uiRequest.messages[0].createSurface;
	const load = (messages: unknown) => () =>
		createA2uiProcessor(
			JSON.stringify({ title: "Example", messages }),
			vi.fn(),
		);
	// a closing bracket where a brace belongs, as a model wrote it; the text shown ends at the mistake
	expect(
		load('[{"version": "1.0", "createSurface": {"surfaceId": "a"]}]'),
	).toThrow(
		/^messages is not valid JSON: .*, right after \[\{"version": "1\.0", "createSurface": \{"surfaceId": "a"$/,
	);
	expect(load([{ createSurface: original }])).toThrow(
		'messages.0.version: Invalid input: expected "1.0"',
	);
	expect(
		load([
			{
				version: "1.0",
				createSurface: original,
				deleteSurface: { surfaceId: original.surfaceId },
			},
		]),
	).toThrow("messages.0: Each message needs exactly one of createSurface");
	expect(load([{ version: "1.0" }])).toThrow("exactly one of createSurface");
	// a pick-one list started with a string instead of a string array
	expect(
		load([
			{
				version: "1.0",
				createSurface: {
					...original,
					dataModel: { notes: "review" },
					components: original.components.map((component) =>
						component.id === "notes"
							? {
									id: "notes",
									component: "ChoicePicker",
									label: "Task",
									options: [
										{ label: "Review", value: "review" },
									],
									value: { "@path": "/notes" },
								}
							: component,
					),
				},
			},
		]),
	).toThrow("Component notes: Initialize its value in the data model");
});

it("rejects oversized payloads and unsupported wire operations before processing", () => {
	expect(() =>
		createA2uiProcessor(
			JSON.stringify({ ...a2uiRequest, title: "x".repeat(65_537) }),
			vi.fn(),
		),
	).toThrow("64 KiB");
	expect(() =>
		createA2uiProcessor(
			JSON.stringify({
				title: "Example",
				messages: [{ version: "1.0", callRendererFunction: {} }],
			}),
			vi.fn(),
		),
	).toThrow();
});

it.each([
	[
		"repeated child",
		{
			id: "root",
			component: "Column",
			children: ["intro", "notes", "notes", "continue"],
		},
	],
	[
		"dynamic child template",
		{
			id: "root",
			component: "Column",
			children: { componentId: "notes", path: "/items" },
		},
	],
	[
		"unsupported validation",
		{
			id: "notes",
			component: "TextField",
			label: "Notes",
			value: { "@path": "/notes" },
			checks: [],
		},
	],
	[
		"unbound input",
		{ id: "notes", component: "TextField", label: "Notes", value: "" },
	],
	[
		"missing input label",
		{
			id: "notes",
			component: "TextField",
			label: "",
			value: { "@path": "/notes" },
		},
	],
	[
		"password input",
		{
			id: "notes",
			component: "TextField",
			label: "Password",
			variant: "obscured",
			value: { "@path": "/notes" },
		},
	],
	[
		"interactive button child",
		{
			id: "continue",
			component: "Button",
			child: "notes",
			action: { event: { name: "prepare" } },
		},
	],
])("rejects a profile violation: %s", (_name, replacement) => {
	const original = a2uiRequest.messages[0].createSurface;
	expect(() =>
		createA2uiProcessor(
			JSON.stringify({
				title: "Example",
				messages: [
					{
						version: "1.0",
						createSurface: {
							...original,
							components: original.components.map((component) =>
								component.id === replacement.id
									? replacement
									: component,
							),
						},
					},
				],
			}),
			vi.fn(),
		),
	).toThrow();
});

it.each([
	["out-of-range slider", { component: "Slider", min: 0, max: 10 }, 100],
	[
		"misaligned slider",
		{ component: "Slider", min: 0, max: 10, steps: 2 },
		3,
	],
	[
		"invalid number",
		{ component: "TextField", variant: "number" },
		"tomorrow",
	],
	["multiline short text", { component: "TextField" }, "line one\nline two"],
	[
		"invalid date",
		{ component: "DateTimeInput", enableDate: true },
		"2026-02-30",
	],
	["invalid time", { component: "DateTimeInput", enableTime: true }, "25:00"],
	[
		"zoned local datetime",
		{ component: "DateTimeInput", enableDate: true, enableTime: true },
		"2026-11-16T09:30Z",
	],
	[
		"unknown choice",
		{
			component: "ChoicePicker",
			options: [{ label: "Review", value: "review" }],
		},
		["other"],
	],
	[
		"multiple single choices",
		{
			component: "ChoicePicker",
			options: [
				{ label: "Review", value: "review" },
				{ label: "Summary", value: "summary" },
			],
		},
		["review", "summary"],
	],
])(
	"rejects a value the native input cannot faithfully display: %s",
	(_name, properties, value) => {
		const original = a2uiRequest.messages[0].createSurface;
		expect(() =>
			createA2uiProcessor(
				JSON.stringify({
					title: "Example",
					messages: [
						{
							version: "1.0",
							createSurface: {
								...original,
								dataModel: { notes: value },
								components: original.components.map(
									(component) =>
										component.id === "notes"
											? {
													id: "notes",
													...properties,
													label: "Initial value",
													value: {
														"@path": "/notes",
													},
												}
											: component,
								),
							},
						},
					],
				}),
				vi.fn(),
			),
		).toThrow();
	},
);
