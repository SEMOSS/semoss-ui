import { z } from "@semoss/ui/next";
import {
	APP_TEST_STEP_TYPES,
	type AppTestRecording,
	type AppTestStep,
} from "./app-test.types";
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
	ASSERT_VALUE: "Check field value",
	ASSERT_CHECKED: "Check checkbox state",
	ASSERT_COUNT: "Check element count",
	ASSERT_HIDDEN: "Check hidden",
	ASSERT_ABSENT: "Check absence",
	ASSERT_URL: "Check page URL",
	WAIT_FOR: "Wait for condition",
	DRAG: "Drag element",
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
		type: z.enum(APP_TEST_STEP_TYPES),
		selector: z.string().max(2000),
		targetSelector: z.string().max(2000),
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
		count: z.string(),
		state: z.enum(["visible", "hidden", "attached", "detached"]),
		timeoutMs: z.string(),
	})
	.superRefine((step, context) => {
		const issue = (field: string, message: string): void =>
			context.addIssue({ code: "custom", path: [field], message });
		if (["NAVIGATE", "ASSERT_URL"].includes(step.type)) {
			if (!relativePathSchema.safeParse(step.path).success)
				issue(
					"path",
					"Use an app-relative page, without /, .. or an external URL",
				);
		} else if (!step.selector.trim())
			issue("selector", "A target selector is required");
		if (
			step.hasPagePath &&
			!relativePathSchema.safeParse(step.pagePath).success
		)
			issue("pagePath", "Use an app-relative page including query/hash");
		if (
			["FILL", "SELECT", "ASSERT_VALUE"].includes(step.type) &&
			step.value.length > 10000
		)
			issue("value", "Use at most 10000 characters");
		if (
			step.type === "ASSERT_TEXT" &&
			(!step.text.trim() || step.text.length > 10000)
		)
			issue("text", "Enter expected text (at most 10000 characters)");
		if (step.type === "KEY" && (!step.key.trim() || step.key.length > 100))
			issue("key", "Enter a key such as Enter (at most 100 characters)");
		if (step.type === "DRAG" && !step.targetSelector.trim())
			issue("targetSelector", "A destination selector is required");
		if (
			step.type === "ASSERT_COUNT" &&
			(!step.count.trim() ||
				!Number.isInteger(Number(step.count)) ||
				Number(step.count) < 0 ||
				Number(step.count) > 10000)
		)
			issue("count", "Enter a whole number from 0 to 10000");
		if (
			step.timeoutMs &&
			(!Number.isInteger(Number(step.timeoutMs)) ||
				Number(step.timeoutMs) < 100 ||
				Number(step.timeoutMs) > 30000)
		)
			issue(
				"timeoutMs",
				"Enter 100 to 30000 milliseconds, or leave empty for 5000",
			);
		if (step.type === "SCROLL")
			for (const axis of ["x", "y"] as const)
				if (
					!step[axis].trim() ||
					!Number.isFinite(Number(step[axis])) ||
					Math.abs(Number(step[axis])) > 10000000
				)
					issue(axis, "Enter a number from -10000000 to 10000000");
	});
export const appTestRecordingFormSchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(120),
	description: z
		.string()
		.trim()
		.min(1, "A test description is required")
		.max(2000),
	startPath: relativePathSchema,
	routeMatch: z.enum(["EXACT", "PORTAL_ROOT"]),
	useVariables: z.boolean(),
	steps: z.array(stepSchema).min(1, "At least one step is required").max(300),
	cleanupSteps: z.array(stepSchema).max(50),
});
export type AppTestRecordingFormValues = z.infer<
	typeof appTestRecordingFormSchema
>;
/** Complete defaults for every action, including newly revealed controls. */
export const newAppTestStep =
	(): AppTestRecordingFormValues["steps"][number] => ({
		type: "CLICK",
		selector: "",
		targetSelector: "",
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
		count: "0",
		state: "visible",
		timeoutMs: "",
	});
const toStep = (
	step: AppTestStep,
): AppTestRecordingFormValues["steps"][number] => ({
	...newAppTestStep(),
	...step,
	frames: (step.framePath ?? []).map((selector) => ({ selector })),
	hasPagePath: step.pagePath !== undefined,
	pagePath: step.pagePath ?? "",
	x: String(step.x ?? 0),
	y: String(step.y ?? 0),
	count: String(step.count ?? 0),
	timeoutMs: step.timeoutMs === undefined ? "" : String(step.timeoutMs),
});
/** Preserve loaded identity separately from editable fields. */
export const toAppTestFormValues = (
	recording: Pick<
		AppTestRecording,
		"name" | "description" | "startPath" | "steps"
	> &
		Partial<
			Pick<
				AppTestRecording,
				"cleanupSteps" | "routeMatch" | "useVariables"
			>
		>,
): AppTestRecordingFormValues => ({
	name: recording.name,
	description: recording.description,
	startPath: recording.startPath,
	routeMatch: recording.routeMatch ?? "EXACT",
	useVariables: recording.useVariables ?? false,
	steps: recording.steps.map(toStep),
	cleanupSteps: (recording.cleanupSteps ?? []).map(toStep),
});
const fromStep = (
	step: AppTestRecordingFormValues["steps"][number],
): AppTestStep => ({
	type: step.type,
	framePath: step.frames.map((frame) => frame.selector),
	...(step.hasPagePath ? { pagePath: step.pagePath } : {}),
	...(["NAVIGATE", "ASSERT_URL"].includes(step.type)
		? { path: step.path }
		: { selector: step.selector }),
	...(["FILL", "SELECT", "ASSERT_VALUE"].includes(step.type)
		? { value: step.value }
		: {}),
	...(["CHECK", "ASSERT_CHECKED"].includes(step.type)
		? { checked: step.checked }
		: {}),
	...(step.type === "ASSERT_TEXT"
		? { text: step.text, exact: step.exact }
		: {}),
	...(step.type === "KEY" ? { key: step.key } : {}),
	...(step.type === "SCROLL" ? { x: Number(step.x), y: Number(step.y) } : {}),
	...(step.type === "ASSERT_COUNT" ? { count: Number(step.count) } : {}),
	...(step.type === "WAIT_FOR" ? { state: step.state } : {}),
	...(step.type === "DRAG" ? { targetSelector: step.targetSelector } : {}),
	...(step.timeoutMs ? { timeoutMs: Number(step.timeoutMs) } : {}),
});
/** Retain optional configuration and serialize only fields relevant to each action. */
export const fromAppTestFormValues = (
	recording: AppTestRecording,
	values: AppTestRecordingFormValues,
): AppTestRecording => ({
	...recording,
	name: values.name,
	description: values.description,
	startPath: values.startPath,
	steps: values.steps.map(fromStep),
	...(values.cleanupSteps.length || recording.cleanupSteps !== undefined
		? { cleanupSteps: values.cleanupSteps.map(fromStep) }
		: {}),
	...(values.routeMatch !== "EXACT" || recording.routeMatch !== undefined
		? { routeMatch: values.routeMatch }
		: {}),
	...(values.useVariables || recording.useVariables !== undefined
		? { useVariables: values.useVariables }
		: {}),
});
