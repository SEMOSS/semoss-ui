import {
	createComponentImplementation,
	type ReactCatalogComponent,
} from "@a2ui/react";
import {
	type ActionPayload,
	ButtonApi,
	CardApi,
	Catalog,
	CheckBoxApi,
	ChoicePickerApi,
	ColumnApi,
	DateTimeInputApi,
	DividerApi,
	MessageProcessor,
	RowApi,
	SliderApi,
	TextApi,
	TextFieldApi,
} from "@a2ui/web_core/v1_0";
import { z } from "@semoss/ui/next";
import { isRecord } from "@semoss/utility/object";
import { A2uiNativeComponent } from "./a2ui-native-component";

export const A2UI_CATALOG_ID = "urn:semoss:collaboration:a2ui:1";

// A local catalog never loads agent-supplied code, media, URLs, or functions.
const catalog = new Catalog<ReactCatalogComponent>(
	A2UI_CATALOG_ID,
	"1.0",
	[
		{
			...TextApi,
			schema: TextApi.schema.pick({ text: true, variant: true }),
		},
		{ ...RowApi, schema: RowApi.schema.pick({ children: true }) },
		{ ...ColumnApi, schema: ColumnApi.schema.pick({ children: true }) },
		{ ...CardApi, schema: CardApi.schema.pick({ child: true }) },
		{ ...DividerApi, schema: DividerApi.schema.pick({ axis: true }) },
		{
			...ButtonApi,
			schema: ButtonApi.schema.pick({
				child: true,
				variant: true,
				action: true,
			}),
		},
		{
			...TextFieldApi,
			schema: TextFieldApi.schema.pick({
				label: true,
				value: true,
				placeholder: true,
				variant: true,
			}),
		},
		{
			...CheckBoxApi,
			schema: CheckBoxApi.schema.pick({ label: true, value: true }),
		},
		{
			...ChoicePickerApi,
			schema: ChoicePickerApi.schema.pick({
				label: true,
				options: true,
				value: true,
				variant: true,
			}),
		},
		{
			...SliderApi,
			schema: SliderApi.schema.pick({
				label: true,
				value: true,
				min: true,
				max: true,
				steps: true,
			}),
		},
		{
			...DateTimeInputApi,
			schema: DateTimeInputApi.schema.pick({
				label: true,
				value: true,
				enableDate: true,
				enableTime: true,
			}),
		},
	].map((api) => createComponentImplementation(api, A2uiNativeComponent)),
	[],
);

const MESSAGE_KINDS = [
	"createSurface",
	"updateComponents",
	"updateDataModel",
	"deleteSurface",
] as const;
const components = z.array(z.record(z.string(), z.unknown())).max(128);
const surfaceId = z.string().min(1).max(100);
const requestSchema = z
	.object({
		title: z.string().trim().min(1).max(200),
		messages: z
			.array(
				// One object, not a union of the four kinds, so a mistake is reported once, at its own path.
				z
					.object({
						version: z.literal("1.0"),
						createSurface: z
							.object({
								surfaceId,
								catalogId: z.literal(A2UI_CATALOG_ID),
								components: components.optional(),
								dataModel: z
									.record(z.string(), z.unknown())
									.optional(),
							})
							.strict()
							.optional(),
						updateComponents: z
							.object({ surfaceId, components })
							.strict()
							.optional(),
						updateDataModel: z
							.object({
								surfaceId,
								path: z.string().optional(),
								value: z.unknown().optional(),
							})
							.strict()
							.optional(),
						deleteSurface: z
							.object({ surfaceId })
							.strict()
							.optional(),
					})
					.strict()
					.refine(
						(message) =>
							MESSAGE_KINDS.filter((kind) => kind in message)
								.length === 1,
						`Each message needs exactly one of ${MESSAGE_KINDS.join(", ")}.`,
					),
			)
			.min(1)
			.max(32),
	})
	.strict();

/**
 * Validate a bounded tool payload, then let the official SDK resolve the graph and bindings.
 * What it throws is returned to the agent, so each error says what to correct.
 */
export function createA2uiProcessor(
	serialized: string,
	onAction: (action: ActionPayload) => void,
): { title: string; processor: MessageProcessor<ReactCatalogComponent> } {
	if (new TextEncoder().encode(serialized).length > 65_536)
		throw new Error("The interface exceeds the 64 KiB limit.");
	const input: unknown = JSON.parse(serialized);
	// A model server hands a list argument over as text when its JSON does not parse.
	if (isRecord(input) && typeof input.messages === "string") {
		const text = input.messages;
		try {
			input.messages = JSON.parse(text) as unknown;
		} catch (error) {
			const reason =
				error instanceof Error
					? error.message
					: "it could not be parsed";
			// shortcut: only V8 reports a position, so other browsers send the reason without the text before it
			const end = Number(/position (\d+)/.exec(reason)?.[1]);
			throw new Error(
				`messages is not valid JSON: ${reason}${end ? `, right after ${text.slice(Math.max(0, end - 60), end)}` : ""}`,
			);
		}
	}
	const parsed = requestSchema.safeParse(input);
	if (!parsed.success)
		throw new Error(
			parsed.error.issues
				.map(
					(issue) =>
						`${issue.path.join(".") || "arguments"}: ${issue.message}`,
				)
				.join("; "),
		);
	const request = parsed.data;
	let count = 0;
	for (const message of request.messages)
		count +=
			(message.createSurface?.components?.length ?? 0) +
			(message.updateComponents?.components.length ?? 0);
	if (count > 128) throw new Error("The interface has too many components.");
	// Even reserved SDK functions are outside this catalog's input-only contract.
	const inspect = (value: unknown, depth = 0): void => {
		if (depth > 20) throw new Error("The interface is nested too deeply.");
		if (!value || typeof value !== "object") return;
		for (const [key, entry] of Object.entries(value)) {
			if (
				[
					"@call",
					"functionCall",
					"__proto__",
					"prototype",
					"constructor",
				].includes(key)
			)
				throw new Error(
					"The interface contains an unsupported operation.",
				);
			inspect(entry, depth + 1);
		}
	};
	inspect(request.messages);
	const processor = new MessageProcessor<ReactCatalogComponent>(
		[catalog],
		onAction,
		{
			version: "1.0",
			validationConfig: {
				targetVersion: "1.0",
				maxDepth: 16,
				allowedMessages: [...MESSAGE_KINDS],
			},
		},
	);
	try {
		const errors = processor.processMessagesWithErrors(request.messages);
		if (errors[0]) throw new Error(errors[0].error.message);
		if (processor.getSurfaces().size !== 1)
			throw new Error("The interface must contain exactly one surface.");
		const surface = processor.getSurfaces().values().next().value;
		if (!surface) throw new Error("The interface is missing its surface.");
		// Bound the rendered tree as well as the wire payload: templates and repeated
		// child references can otherwise expand a small graph into an enormous UI.
		const visited = new Set<string>();
		let hasButton = false;
		let current = surface.rootId;
		const visit = (id: string, depth: number): void => {
			current = id;
			if (depth > 16 || visited.has(id))
				throw new Error(
					"Use a tree of unique component IDs, at most 16 levels deep.",
				);
			visited.add(id);
			const component = surface.componentsModel.get(id);
			if (!component) throw new Error(`Missing component: ${id}.`);
			const props: Record<string, unknown> = component.properties;
			if (component.type === "Row" || component.type === "Column") {
				if (
					!Array.isArray(props.children) ||
					!props.children.every((child) => typeof child === "string")
				)
					throw new Error(
						"Rows and columns require a fixed array of child IDs.",
					);
				for (const child of props.children) visit(child, depth + 1);
			} else if (
				component.type === "Button" ||
				component.type === "Card"
			) {
				if (typeof props.child !== "string")
					throw new Error("A child must be a component ID.");
				if (component.type === "Button") {
					const label = surface.componentsModel.get(props.child);
					if (
						label?.type !== "Text" ||
						typeof label.properties.text !== "string" ||
						!label.properties.text.trim()
					)
						throw new Error(
							"Each button needs a Text child with a visible label.",
						);
					hasButton = true;
				}
				visit(props.child, depth + 1);
			}
			if (
				[
					"TextField",
					"CheckBox",
					"ChoicePicker",
					"Slider",
					"DateTimeInput",
				].includes(component.type)
			) {
				if (typeof props.label !== "string" || !props.label.trim())
					throw new Error("Each input needs a visible label.");
				if (
					!isRecord(props.value) ||
					typeof props.value["@path"] !== "string" ||
					!props.value["@path"].startsWith("/")
				)
					throw new Error(
						"Bind each input value to an absolute @path in the data model.",
					);
				const value: unknown = surface.dataModel.get(
					props.value["@path"],
				);
				const valid =
					component.type === "CheckBox"
						? typeof value === "boolean"
						: component.type === "Slider"
							? typeof value === "number" &&
								Number.isFinite(value)
							: component.type === "ChoicePicker"
								? Array.isArray(value) &&
									value.every(
										(entry) => typeof entry === "string",
									)
								: typeof value === "string";
				if (!valid)
					throw new Error(
						'Initialize its value in the data model with the right type: a string array for ChoicePicker ([] or ["value"], even for one choice), true or false for CheckBox, a number for Slider, a string for the others.',
					);
				if (
					component.type === "TextField" &&
					props.variant === "obscured"
				)
					throw new Error("Password inputs are not supported.");
				// Native inputs sanitize invalid initial values. Reject them so a blank
				// field or clamped thumb cannot submit a different, hidden SDK value.
				if (component.type === "Slider") {
					const min = typeof props.min === "number" ? props.min : 0;
					const max = props.max;
					const steps = props.steps;
					if (
						typeof max !== "number" ||
						!Number.isFinite(max - min) ||
						max <= min ||
						typeof value !== "number" ||
						value < min ||
						value > max ||
						(steps !== undefined &&
							(typeof steps !== "number" ||
								!Number.isSafeInteger(steps) ||
								steps < 1))
					)
						throw new Error(
							"A slider needs a value within its increasing range and positive integer steps.",
						);
					if (typeof steps === "number") {
						const position = ((value - min) / (max - min)) * steps;
						if (
							Math.abs(position - Math.round(position)) >
							Number.EPSILON * Math.max(1, Math.abs(position)) * 8
						)
							throw new Error(
								"The slider value must align with its steps.",
							);
					}
				}
				if (
					component.type === "TextField" &&
					props.variant === "number" &&
					value !== "" &&
					(typeof value !== "string" ||
						!/^-?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(
							value,
						) ||
						!Number.isFinite(Number(value)))
				)
					throw new Error(
						"Initialize a number input with a numeric string or an empty string.",
					);
				if (
					component.type === "TextField" &&
					props.variant !== "longText" &&
					typeof value === "string" &&
					/[\r\n]/.test(value)
				)
					throw new Error("Use longText for multiline input values.");
				if (component.type === "DateTimeInput") {
					if (props.enableDate !== true && props.enableTime !== true)
						throw new Error(
							"Enable date or time on a date/time input.",
						);
					if (typeof value === "string" && value !== "") {
						const parts = value.split("T");
						const date = props.enableDate ? parts[0] : undefined;
						const time = props.enableTime
							? parts[props.enableDate ? 1 : 0]
							: undefined;
						if (
							parts.length !==
								(props.enableDate && props.enableTime
									? 2
									: 1) ||
							(props.enableDate &&
								(!date ||
									date.startsWith("0000") ||
									!z.iso.date().safeParse(date).success)) ||
							(props.enableTime &&
								(!time ||
									!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)))
						)
							throw new Error(
								"Use a valid local date (YYYY-MM-DD), time (HH:mm), or both separated by T.",
							);
					}
				}
				if (component.type === "ChoicePicker") {
					const options = props.options;
					const optionValues = new Set<string>();
					if (
						!Array.isArray(options) ||
						options.length < 1 ||
						options.length > 50
					)
						throw new Error("Use between 1 and 50 choices.");
					for (const option of options) {
						if (
							!isRecord(option) ||
							typeof option.label !== "string" ||
							!option.label.trim() ||
							typeof option.value !== "string" ||
							!option.value ||
							optionValues.has(option.value)
						)
							throw new Error(
								"Each choice needs a visible label and a unique nonempty value.",
							);
						optionValues.add(option.value);
					}
					if (
						!Array.isArray(value) ||
						value.some((entry) => !optionValues.has(entry)) ||
						new Set(value).size !== value.length ||
						(props.variant !== "multipleSelection" &&
							value.length > 1)
					)
						throw new Error(
							"Initialize choices with available values and at most one value for single selection.",
						);
				}
			}
		};
		try {
			visit(surface.rootId, 1);
		} catch (error) {
			throw new Error(
				`Component ${current}: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
		if (!hasButton)
			throw new Error("Include a labeled button to send the response.");
		return { title: request.title, processor };
	} catch (error) {
		processor.dispose();
		throw error;
	}
}
