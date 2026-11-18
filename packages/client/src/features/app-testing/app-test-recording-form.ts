import { z } from "@semoss/ui/next";
import type { AppTestRecording, AppTestStep } from "./app-test.types";

/** Human-readable choices for every operation supported by the runner. */
export const APP_TEST_ACTIONS = {
	CLICK: "Click",
	FILL: "Fill field",
	SELECT: "Select option",
	CHECK: "Set checkbox",
	KEY: "Press key",
	SCROLL: "Scroll element",
	ASSERT_TEXT: "Check text",
	ASSERT_VISIBLE: "Check visibility",
	NAVIGATE: "Navigate",
} as const;

/** Match the backend's confinement to relative URLs inside this app. */
const relativePathSchema = z
	.string()
	.max(2048)
	.refine((value) => {
		if (
			value.startsWith("/") ||
			value.includes("\\") ||
			[...value].some((character) => character.charCodeAt(0) < 32) ||
			/^[a-z][a-z\d+.-]*:/i.test(value)
		)
			return false;
		try {
			const path = decodeURIComponent(value.split(/[?#]/)[0]);
			return (
				!path.startsWith("/") &&
				!/[\\%]/.test(path) &&
				!path.split("/").some((part) => part === "." || part === "..")
			);
		} catch {
			return false;
		}
	}, "Use a relative page inside this app, without /, .. or an external URL");

const stepSchema = z
	.object({
		type: z.enum([
			"CLICK",
			"FILL",
			"SELECT",
			"CHECK",
			"KEY",
			"SCROLL",
			"ASSERT_TEXT",
			"ASSERT_VISIBLE",
			"NAVIGATE",
		]),
		selector: z.string().max(2000),
		frames: z
			.array(
				z.object({
					selector: z
						.string()
						.min(1, "A frame selector is required")
						.max(2000),
				}),
			)
			.max(5),
		hasPagePath: z.boolean(),
		pagePath: z.string(),
		path: z.string(),
		value: z.string(),
		checked: z.boolean(),
		key: z.string(),
		text: z.string(),
		exact: z.boolean(),
		x: z.string(),
		y: z.string(),
	})
	.superRefine((step, context) => {
		const issue = (field: string, message: string): void => {
			context.addIssue({ code: "custom", path: [field], message });
		};
		const path = (field: "path" | "pagePath"): void => {
			if (!relativePathSchema.safeParse(step[field]).success)
				issue(
					field,
					"Use a relative page inside this app, without /, .. or an external URL",
				);
		};
		if (step.type === "NAVIGATE") path("path");
		else if (!step.selector.trim())
			issue("selector", "A target selector is required");
		if (step.hasPagePath) path("pagePath");
		if (["FILL", "SELECT"].includes(step.type) && step.value.length > 10000)
			issue("value", "Use at most 10000 characters");
		if (
			step.type === "ASSERT_TEXT" &&
			(!step.text.trim() || step.text.length > 10000)
		)
			issue("text", "Enter expected text (at most 10000 characters)");
		if (step.type === "KEY" && (!step.key.trim() || step.key.length > 100))
			issue("key", "Enter a key such as Enter (at most 100 characters)");
		if (step.type === "SCROLL") {
			for (const axis of ["x", "y"] as const) {
				const number = Number(step[axis]);
				if (
					!step[axis].trim() ||
					!Number.isFinite(number) ||
					Math.abs(number) > 10000000
				)
					issue(axis, "Enter a number from -10000000 to 10000000");
			}
		}
	});

/** Editable fields only; the platform owns identity, format version and update time. */
export const appTestRecordingFormSchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(120),
	description: z
		.string()
		.trim()
		.min(1, "A test description is required")
		.max(2000),
	startPath: relativePathSchema,
	steps: z.array(stepSchema).min(1, "At least one step is required").max(300),
});
export type AppTestRecordingFormValues = z.infer<
	typeof appTestRecordingFormSchema
>;

/** Complete defaults for a new step, including controls revealed by action changes. */
export const newAppTestStep =
	(): AppTestRecordingFormValues["steps"][number] => ({
		type: "CLICK",
		selector: "",
		frames: [],
		hasPagePath: false,
		pagePath: "",
		path: "",
		value: "",
		checked: false,
		key: "Enter",
		text: "",
		exact: false,
		x: "0",
		y: "0",
	});

/** Initialize every form field without treating an absent page wait as a root-page wait. */
export const toAppTestFormValues = (
	recording: Pick<
		AppTestRecording,
		"name" | "description" | "startPath" | "steps"
	>,
): AppTestRecordingFormValues => ({
	name: recording.name,
	description: recording.description,
	startPath: recording.startPath,
	steps: recording.steps.map((step) => ({
		...newAppTestStep(),
		type: step.type,
		selector: step.selector ?? "",
		frames: (step.framePath ?? []).map((selector) => ({ selector })),
		hasPagePath: step.pagePath !== undefined,
		pagePath: step.pagePath ?? "",
		path: step.path ?? "",
		value: step.value ?? "",
		checked: step.checked ?? false,
		key: step.key ?? "Enter",
		text: step.text ?? "",
		exact: step.exact ?? false,
		x: String(step.x ?? 0),
		y: String(step.y ?? 0),
	})),
});

/** Serialize only action-relevant fields and preserve the loaded recording's immutable metadata. */
export const fromAppTestFormValues = (
	recording: AppTestRecording,
	values: AppTestRecordingFormValues,
): AppTestRecording => ({
	...recording,
	name: values.name,
	description: values.description,
	startPath: values.startPath,
	steps: values.steps.map(
		(step): AppTestStep => ({
			type: step.type,
			framePath: step.frames.map((frame) => frame.selector),
			...(step.hasPagePath ? { pagePath: step.pagePath } : {}),
			...(step.type === "NAVIGATE"
				? { path: step.path }
				: { selector: step.selector }),
			...(["FILL", "SELECT"].includes(step.type)
				? { value: step.value }
				: {}),
			...(step.type === "CHECK" ? { checked: step.checked } : {}),
			...(step.type === "KEY" ? { key: step.key } : {}),
			...(step.type === "ASSERT_TEXT"
				? { text: step.text, exact: step.exact }
				: {}),
			...(step.type === "SCROLL"
				? { x: Number(step.x), y: Number(step.y) }
				: {}),
		}),
	),
});
