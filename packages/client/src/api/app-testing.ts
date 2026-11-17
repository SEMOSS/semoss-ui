import { z } from "zod";
import { Session } from "@semoss/sdk";
import type {
	AppTestDraft,
	AppTestRecording,
	AppTestRun,
	AppTestSession,
	EngineTestConfiguration,
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
	exact: z.boolean().optional(),
	x: z.number().optional(),
	y: z.number().optional(),
	path: z.string().optional(),
});

const recordingSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().default(""),
	engineTestConfigurationId: z.string().optional(),
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
	databaseMode: z.string().optional(),
	engineTestConfiguration: z
		.object({
			configurationId: z.string(),
			mappings: z.record(z.string(), z.string()),
		})
		.optional(),
	tests: z
		.array(
			z.object({
				name: z.string(),
				description: z.string().optional(),
				status: z.string(),
				reason: z.string().optional(),
				classification: z.string().optional(),
				repeats: z.number().optional(),
				passedRepeats: z.number().optional(),
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
	repeat = 1,
): Promise<AppTestRun> => {
	const repeatArgument = repeat > 1 ? `, repeat=[${repeat}]` : "";
	const result = runSchema.parse(
		await callAppTestPixel(
			`RunAppTests(project=${JSON.stringify([appId])}, suite=${JSON.stringify([recordingId])}${repeatArgument});`,
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

const engineConfigurationSchema = z.object({
	id: z.string(),
	version: z.number(),
	name: z.string(),
	mappings: z.array(
		z.object({ realEngineId: z.string(), testEngineId: z.string() }),
	),
	denyUnmappedDatabases: z.boolean(),
	updatedAt: z.string(),
});

/** Parse configuration reads without silently treating a corrupt profile as absent. */
export const parseEngineTestConfiguration = (
	appId: string,
	value: unknown,
): EngineTestConfiguration | null => {
	const result = z
		.object({
			target: z.string(),
			configuration: engineConfigurationSchema.nullable(),
		})
		.parse(value);
	if (result.target !== appId) throw new Error("The app test target changed");
	return result.configuration;
};

/** Read the optional app-owned database profile. */
export const getEngineTestConfiguration = async (
	appId: string,
): Promise<EngineTestConfiguration | null> =>
	parseEngineTestConfiguration(
		appId,
		await callAppTestPixel(
			`GetEngineTestConfiguration(project=${JSON.stringify([appId])});`,
		),
	);

/** Save mappings; backend validates permissions and dedicated file-backed test storage. */
export const saveEngineTestConfiguration = async (
	appId: string,
	configuration: Pick<EngineTestConfiguration, "name" | "mappings"> & {
		id?: string;
	},
): Promise<EngineTestConfiguration> =>
	engineConfigurationSchema.parse(
		await callAppTestPixel(
			`SaveEngineTestConfiguration(project=${JSON.stringify([appId])}, configuration=${JSON.stringify([configuration])});`,
		),
	);

/** Remove the profile without deleting its databases. Referencing recordings remain protected. */
export const deleteEngineTestConfiguration = async (
	appId: string,
): Promise<void> => {
	z.object({ target: z.literal(appId), deleted: z.literal(true) }).parse(
		await callAppTestPixel(
			`DeleteEngineTestConfiguration(project=${JSON.stringify([appId])});`,
		),
	);
};

/** Provision an empty private database through normal SEMOSS creation policies. */
export const createAppTestDatabase = async (
	appId: string,
	name: string,
	rdbmsType: "H2_DB" | "SQLITE",
): Promise<string> => {
	const result = z
		.object({ target: z.literal(appId), engineId: z.string() })
		.parse(
			await callAppTestPixel(
				`CreateAppTestDatabase(project=${JSON.stringify([appId])}, name=${JSON.stringify([name])}, rdbmsType=${JSON.stringify([rdbmsType])});`,
			),
		);
	return result.engineId;
};

/** Begin isolation before the preview is reloaded; this does not affect ordinary tabs. */
export const beginAppTestSession = async (
	appId: string,
): Promise<AppTestSession> =>
	z
		.object({
			target: z.literal(appId),
			sessionToken: z.string().uuid(),
			configurationId: z.string(),
			expiresAt: z.string(),
		})
		.parse(
			await callAppTestPixel(
				`BeginAppTestSession(project=${JSON.stringify([appId])});`,
			),
		);

/** End routing on the backend; the preview bridge separately restores normal browsing. */
export const endAppTestSession = async (
	appId: string,
	sessionToken: string,
): Promise<void> => {
	z.object({ target: z.literal(appId), ended: z.literal(true) }).parse(
		await callAppTestPixel(
			`EndAppTestSession(project=${JSON.stringify([appId])}, sessionToken=${JSON.stringify([sessionToken])});`,
		),
	);
};
