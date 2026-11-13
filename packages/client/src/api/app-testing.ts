import { z } from "zod";
import { Session } from "@semoss/sdk";
import type {
	AppTestDraft,
	AppTestRecording,
	AppTestRun,
} from "@/features/app-testing/app-test.types";

const stepSchema = z.object({
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
	selector: z.string().optional(),
	framePath: z.array(z.string()).optional(),
	value: z.string().optional(),
	checked: z.boolean().optional(),
	key: z.string().optional(),
	text: z.string().optional(),
	x: z.number().optional(),
	y: z.number().optional(),
	path: z.string().optional(),
});

const recordingSchema = z.object({
	id: z.string(),
	name: z.string(),
	startPath: z.string(),
	steps: z.array(stepSchema),
	version: z.number(),
	updatedAt: z.string(),
});

/** Validate list responses before a view uses persisted recording data. */
export const parseAppTestRecordings = (
	appId: string,
	value: unknown,
): AppTestRecording[] => {
	const result = z
		.object({ target: z.string(), recordings: z.array(recordingSchema) })
		.parse(value);
	if (result.target !== appId) throw new Error("The app test target changed");
	return result.recordings;
};

const runSchema = z.object({
	runId: z.string(),
	target: z.string(),
	status: z.string(),
	scope: z.string().optional(),
	coverageWarning: z.string().optional(),
	summary: z.record(z.string(), z.number()).optional(),
	error: z.string().optional(),
	tests: z
		.array(
			z.object({
				name: z.string(),
				status: z.string(),
				reason: z.string().optional(),
				classification: z.string().optional(),
			}),
		)
		.optional(),
});

/** Read a Pixel result, preserving backend failures for retry. */
const callAppTestPixel = async (pixel: string): Promise<unknown> => {
	const response = await Session.insight.run<[unknown]>(`META | ${pixel}`);
	if (response.errors.length) {
		throw new Error(response.errors.join("\n"));
	}
	const result = response.pixelReturn[0];
	if (!result) throw new Error("The app testing service returned no result");
	return result.output;
};

/** List platform recordings for one explicit app. */
export const listAppTestRecordings = async (
	appId: string,
): Promise<AppTestRecording[]> => {
	return parseAppTestRecordings(
		appId,
		await callAppTestPixel(
			`ListAppTestRecordings(project=${JSON.stringify([appId])});`,
		),
	);
};

/** Save a draft without writing into the target app. */
export const saveAppTestRecording = async (
	appId: string,
	draft: AppTestDraft,
): Promise<AppTestRecording> =>
	recordingSchema.parse(
		await callAppTestPixel(
			`SaveAppTestRecording(project=${JSON.stringify([appId])}, recording=${JSON.stringify([draft])});`,
		),
	);

/** Start actual replay of a selected recording for the edited app. */
export const runAppTests = async (
	appId: string,
	recordingId: string,
): Promise<AppTestRun> => {
	const result = runSchema.parse(
		await callAppTestPixel(
			`RunAppTests(project=${JSON.stringify([appId])}, suite=${JSON.stringify([recordingId])});`,
		),
	);
	if (result.target !== appId) throw new Error("The app test target changed");
	return result;
};

/** Poll the initiating user's run and reject mismatched app results. */
export const getAppTestRun = async (
	appId: string,
	runId: string,
): Promise<AppTestRun> => {
	const result = runSchema.parse(
		await callAppTestPixel(
			`GetAppTestRun(runId=${JSON.stringify([runId])});`,
		),
	);
	if (result.target !== appId || result.runId !== runId) {
		throw new Error("The app test target changed");
	}
	return result;
};

/** Remove a saved recording after an explicit user action. */
export const deleteAppTestRecording = async (
	appId: string,
	recordingId: string,
): Promise<void> => {
	z.object({ deleted: z.literal(true) }).parse(
		await callAppTestPixel(
			`DeleteAppTestRecording(project=${JSON.stringify([appId])}, recordingId=${JSON.stringify([recordingId])});`,
		),
	);
};
