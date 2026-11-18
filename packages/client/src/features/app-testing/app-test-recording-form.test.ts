import { expect, it } from "vitest";
import type { AppTestRecording } from "./app-test.types";
import {
	appTestRecordingFormSchema,
	fromAppTestFormValues,
	newAppTestStep,
	toAppTestFormValues,
} from "./app-test-recording-form";

const recording: AppTestRecording = {
	id: "original-id",
	version: 1,
	updatedAt: "2026-11-18T12:00:00Z",
	name: "All actions",
	description: "Verify every supported field.",
	startPath: "start?q=1#main",
	steps: [
		{
			type: "CLICK",
			selector: "#go",
			framePath: ["#outer", "#inner"],
			pagePath: "",
		},
		{ type: "FILL", selector: "#input", value: "", pagePath: "edit.html" },
		{ type: "SELECT", selector: "#options", value: "two" },
		{ type: "CHECK", selector: "#checkbox", checked: false },
		{ type: "KEY", selector: "#input", key: "Control+A" },
		{ type: "SCROLL", selector: "#list", x: -50, y: 0 },
		{ type: "ASSERT_TEXT", selector: "#result", text: "50", exact: true },
		{ type: "ASSERT_VISIBLE", selector: "#result" },
		{ type: "NAVIGATE", path: "orders?view=all#summary" },
	],
};

it("round-trips all action fields and preserves metadata, empty values and optional page waits", () => {
	const values = appTestRecordingFormSchema.parse(
		toAppTestFormValues(recording),
	);
	expect(Object.keys(values)).toEqual([
		"name",
		"description",
		"startPath",
		"steps",
	]);
	const saved = fromAppTestFormValues(recording, values);
	expect(saved.id).toBe(recording.id);
	expect(saved.version).toBe(recording.version);
	expect(saved.updatedAt).toBe(recording.updatedAt);
	for (const [index, step] of recording.steps.entries())
		expect(saved.steps[index]).toEqual({
			...step,
			framePath: step.framePath ?? [],
		});
	expect(saved.steps[0].pagePath).toBe("");
	expect(saved.steps[2]).not.toHaveProperty("pagePath");
	expect(saved.steps[1].value).toBe("");
});

it("rejects blank numbers, unsafe routes, empty assertions and empty frame selectors", () => {
	const values = toAppTestFormValues(recording);
	values.steps[5].x = "";
	expect(appTestRecordingFormSchema.safeParse(values).success).toBe(false);
	values.steps[5].x = "0";
	for (const startPath of [
		"/outside",
		"../outside",
		"https://outside/",
		"%2e%2e/outside",
		"x\\other",
	]) {
		expect(
			appTestRecordingFormSchema.safeParse({ ...values, startPath })
				.success,
		).toBe(false);
	}
	values.steps[6].text = " ";
	expect(appTestRecordingFormSchema.safeParse(values).success).toBe(false);
	values.steps[6].text = "50";
	values.steps[0].frames[0].selector = "";
	expect(appTestRecordingFormSchema.safeParse(values).success).toBe(false);
});

it("serializes an action change without retaining fields from the previous action", () => {
	const values = toAppTestFormValues(recording);
	values.steps[6].type = "CLICK";
	const changed = fromAppTestFormValues(
		recording,
		appTestRecordingFormSchema.parse(values),
	);
	expect(changed.steps[6]).toEqual({
		type: "CLICK",
		selector: "#result",
		framePath: [],
	});
	expect(
		appTestRecordingFormSchema.safeParse({
			...values,
			steps: [newAppTestStep()],
		}).success,
	).toBe(false);
});
