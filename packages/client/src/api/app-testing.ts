import { z } from "zod";
import { Session } from "@semoss/sdk";
import type {
	AppTestBrowserOptions,
	AppTestDraft,
	AppTestRecording,
	AppTestRecordingSummary,
	AppTestRun,
	AppTestRunHistory,
	AppTestRunHistoryPage,
} from "@/features/app-testing/app-test.types";
import { APP_TEST_STEP_TYPES } from "@/features/app-testing/app-test.types";

const stepSchema = z.object({
	type: z.enum(APP_TEST_STEP_TYPES),
	targetSelector: z.string().optional(),
	count: z.number().int().nonnegative().optional(),
	state: z.enum(["visible", "hidden", "attached", "detached"]).optional(),
	timeoutMs: z.number().int().min(100).max(30000).optional(),
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
	pagePath: z.string().optional(),
});

const recordingFieldsSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().trim().min(1).optional(),
	startPath: z.string(),
	steps: z.array(stepSchema),
	cleanupSteps: z.array(stepSchema).max(50).optional(),
	routeMatch: z.enum(["EXACT", "PORTAL_ROOT"]).optional(),
	useVariables: z.boolean().optional(),
	version: z.number(),
	updatedAt: z.string(),
});

const recordingSchema = recordingFieldsSchema.transform((recording) => ({
	...recording,
	description:
		recording.description ??
		`Replays the recorded workflow: ${recording.name}.`,
}));

/** Validate an edited file without silently removing unknown fields or changing its identity. */
export const parseAppTestRecordingFile = (
	content: string,
	expectedId: string,
): AppTestRecording => {
	let value: unknown;
	try {
		value = JSON.parse(content);
	} catch {
		throw new Error("Enter valid JSON before saving.");
	}
	const parsed = recordingFieldsSchema
		.extend({
			id: z.literal(expectedId),
			version: z.literal(1),
			name: z.string().trim().min(1).max(120),
			description: z
				.string()
				.trim()
				.min(1, "A test description is required")
				.max(2000),
			steps: z.array(stepSchema.strict()).min(1).max(300),
		})
		.strict()
		.safeParse(value);
	if (!parsed.success) {
		throw new Error(
			parsed.error.issues
				.map(
					(issue) =>
						`${issue.path.join(".") || "File"}: ${issue.message}`,
				)
				.join("\n"),
		);
	}
	return parsed.data;
};

/** Validate list responses before a view uses persisted recording data. */
export const parseAppTestRecordings = (
	appId: string,
	value: unknown,
): AppTestRecordingSummary[] => {
	const result = z
		.object({
			target: z.string(),
			recordings: z.array(
				recordingFieldsSchema
					.pick({ id: true, name: true, description: true })
					.transform((recording) => ({
						...recording,
						description:
							recording.description ??
							`Replays the recorded workflow: ${recording.name}.`,
					})),
			),
		})
		.parse(value);
	if (result.target !== appId) throw new Error("The app test target changed");
	return result.recordings;
};

const runSchema = z.object({
	headless: z.boolean().optional(),
	keepOpen: z.boolean().optional(),
	browserOpen: z.boolean().optional(),
	browserClosesAt: z.string().optional(),
	runId: z.string(),
	target: z.string(),
	status: z.string(),
	mode: z.string().optional(),
	fixtureHash: z.string().optional(),
	portalHash: z.string().optional(),
	scope: z.string().optional(),
	coverageWarning: z.string().optional(),
	summary: z.record(z.string(), z.number()).optional(),
	error: z.string().optional(),
	historyWarning: z.string().optional(),
	reportWarning: z.string().optional(),
	tests: z
		.array(
			z.object({
				name: z.string(),
				description: z.string().optional(),
				status: z.string(),
				reason: z.string().optional(),
				classification: z.string().optional(),
				failedStep: z.number().optional(),
				expected: z.unknown().optional(),
				actual: z.unknown().optional(),
				page: z.string().optional(),
				availableTestIds: z.array(z.string()).max(40).optional(),
				stepsAttempted: z.number().optional(),
				stepsCompleted: z.number().optional(),
				assertions: z.number().optional(),
				assertionsPassed: z.number().optional(),
				cleanup: z
					.object({
						status: z.string(),
						stepsAttempted: z.number().optional(),
						stepsCompleted: z.number().optional(),
						failedStep: z.number().optional(),
						reason: z.string().optional(),
					})
					.optional(),
				repeats: z.number().optional(),
				passedRepeats: z.number().optional(),
			}),
		)
		.optional(),
});

const historyResultSchema = z.object({
	id: z.string(),
	name: z.string(),
	status: z.string(),
	steps: z.number().int().nonnegative(),
	stepsAttempted: z.number().int().nonnegative(),
	stepsCompleted: z.number().int().nonnegative(),
	assertions: z.number().int().nonnegative(),
	assertionsPassed: z.number().int().nonnegative(),
	durationMs: z.number().nonnegative().optional(),
	definitionHash: z.string().optional(),
	classification: z.string().optional(),
	reason: z.string().optional(),
	failedStep: z.number().int().nonnegative().optional(),
	startedAt: z.iso.datetime().optional(),
	finishedAt: z.iso.datetime().optional(),
	repeats: z.number().int().positive().optional(),
	passedRepeats: z.number().int().nonnegative().optional(),
});
const latestResultSchema = historyResultSchema.extend({
	runId: z.string(),
	startedAt: z.iso.datetime(),
});

/** Validate history summaries against the app before showing any persisted result. */
export const parseAppTestRunHistoryPage = (
	appId: string,
	value: unknown,
	recordingId?: string,
): AppTestRunHistoryPage => {
	const page = z
		.object({
			target: z.literal(appId),
			runs: z.array(
				z.object({
					runId: z.string(),
					status: z.string(),
					mode: z.string().optional(),
					startedAt: z.iso.datetime(),
					finishedAt: z.iso.datetime().optional(),
					durationMs: z.number().nonnegative().optional(),
					test: latestResultSchema.optional(),
				}),
			),
			latest: z.array(latestResultSchema),
			total: z.number().int().nonnegative(),
			offset: z.number().int().nonnegative(),
			hasMore: z.boolean(),
			retainedRuns: z.number().int().positive(),
		})
		.parse(value);
	if (
		recordingId &&
		(page.latest.some((test) => test.id !== recordingId) ||
			page.runs.some(
				(run) =>
					run.test?.id !== recordingId ||
					run.test.runId !== run.runId,
			))
	) {
		throw new Error("The test history target changed");
	}
	return page;
};

/** Read one result only after the user opens it; reject different app/run/test identities. */
export const parseAppTestRunHistory = (
	appId: string,
	runId: string,
	recordingId: string,
	value: unknown,
): AppTestRunHistory => {
	const result = z
		.object({
			target: z.literal(appId),
			run: z.object({
				runId: z.literal(runId),
				target: z.literal(appId),
				status: z.string(),
				mode: z.string().optional(),
				fixtureHash: z.string().optional(),
				portalHash: z.string().optional(),
				startedAt: z.iso.datetime(),
				finishedAt: z.iso.datetime().optional(),
				durationMs: z.number().nonnegative().optional(),
				tests: z.array(historyResultSchema).min(1),
			}),
		})
		.parse(value);
	if (result.run.tests.some((test) => test.id !== recordingId))
		throw new Error("The test history target changed");
	return result.run;
};

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
): Promise<AppTestRecordingSummary[]> => {
	return parseAppTestRecordings(
		appId,
		await callAppTestPixel(
			`ListAppTestRecordings(project=${JSON.stringify([appId])});`,
		),
	);
};

/** Validate an individual definition against both requested identities. */
export const parseAppTestRecording = (
	appId: string,
	recordingId: string,
	value: unknown,
): AppTestRecording => {
	const result = z
		.object({ target: z.string(), recording: recordingSchema })
		.parse(value);
	if (result.target !== appId || result.recording.id !== recordingId) {
		throw new Error("The app test target or recording changed");
	}
	return result.recording;
};

/** Read only the one definition needed for inspection or editing. */
export const getAppTestRecording = async (
	appId: string,
	recordingId: string,
): Promise<AppTestRecording> =>
	parseAppTestRecording(
		appId,
		recordingId,
		await callAppTestPixel(
			`GetAppTestRecording(project=${JSON.stringify([appId])}, recordingId=${JSON.stringify([recordingId])});`,
		),
	);

/** Create or update a declarative JSON test in the app's non-public assets. */
export const saveAppTestRecording = async (
	appId: string,
	draft: AppTestDraft,
): Promise<AppTestRecording> =>
	recordingSchema.parse(
		await callAppTestPixel(
			`SaveAppTestRecording(project=${JSON.stringify([appId])}, recording=${JSON.stringify([draft])});`,
		),
	);

/** Import a saved definition or draft as a new test, never overwriting an uploaded id. */
export const parseAppTestUpload = (content: string): AppTestDraft => {
	let value: unknown;
	try {
		value = JSON.parse(content);
	} catch {
		throw new Error("Choose a valid test JSON file.");
	}
	const parsed = recordingFieldsSchema
		.extend({
			id: z.string().optional(),
			version: z.literal(1).optional(),
			updatedAt: z.string().optional(),
			name: z.string().trim().min(1).max(120),
			description: z
				.string()
				.trim()
				.min(1, "A test description is required")
				.max(2000),
			startPath: z.string().default(""),
			steps: z.array(stepSchema.strict()).min(1).max(300),
		})
		.strict()
		.safeParse(value);
	if (!parsed.success)
		throw new Error(
			parsed.error.issues
				.map(
					(issue) =>
						`${issue.path.join(".") || "File"}: ${issue.message}`,
				)
				.join("\n"),
		);
	return {
		name: parsed.data.name,
		description: parsed.data.description,
		startPath: parsed.data.startPath,
		steps: parsed.data.steps,
		...(parsed.data.cleanupSteps !== undefined
			? { cleanupSteps: parsed.data.cleanupSteps }
			: {}),
		...(parsed.data.routeMatch !== undefined
			? { routeMatch: parsed.data.routeMatch }
			: {}),
		...(parsed.data.useVariables !== undefined
			? { useVariables: parsed.data.useVariables }
			: {}),
	};
};

/** An intentional whole-app run; never used as the default for an omitted UUID. */
export const runAllAppTests = async (
	appId: string,
	browserOptions?: AppTestBrowserOptions,
): Promise<AppTestRun> => {
	const browserArguments = browserOptions
		? `, headless=[${browserOptions.headless}], keepOpen=[${browserOptions.keepOpen}]`
		: "";
	const result = runSchema.parse(
		await callAppTestPixel(
			`RunAppTests(project=${JSON.stringify([appId])}, all=[true]${browserArguments});`,
		),
	);
	if (result.target !== appId) throw new Error("The app test target changed");
	return result;
};

/** Start actual replay of a selected recording for the edited app. */
export const runAppTests = async (
	appId: string,
	recordingId: string,
	repeat = 1,
	browserOptions?: AppTestBrowserOptions,
): Promise<AppTestRun> => {
	if (!recordingId.trim())
		throw new Error("Choose a test recording before running it");
	const selectionArgument =
		recordingId === "__platform_smoke__"
			? `suite=${JSON.stringify([recordingId])}`
			: `recordingIds=${JSON.stringify([recordingId])}`;
	const repeatArgument = repeat > 1 ? `, repeat=[${repeat}]` : "";
	const browserArguments = browserOptions
		? `, headless=[${browserOptions.headless}], keepOpen=[${browserOptions.keepOpen}]`
		: "";
	const result = runSchema.parse(
		await callAppTestPixel(
			`RunAppTests(project=${JSON.stringify([appId])}, ${selectionArgument}${repeatArgument}${browserArguments});`,
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

/** Keep errors beside valid summaries while preserving the legacy summaries-only parser. */
export const parseAppTestDiscovery = (appId: string, value: unknown) => {
	const recordings = parseAppTestRecordings(appId, value);
	const result = z
		.object({
			testDatabaseEnabled: z.boolean().default(false),
			invalid: z
				.array(
					z.object({
						file: z
							.string()
							.min(1)
							.max(255)
							.refine(
								(name) =>
									!/[\\/]/.test(name) &&
									name.endsWith(".json"),
							),
						code: z.string(),
						reason: z.string(),
					}),
				)
				.default([]),
		})
		.parse(value);
	return {
		recordings,
		invalid: result.invalid,
		testDatabaseEnabled: result.testDatabaseEnabled,
	};
};

/** Only a server-reported invalid filename may be deleted through the explicit invalid-file action. */
export const deleteInvalidAppTestFile = async (
	appId: string,
	fileName: string,
): Promise<void> => {
	if (!fileName || /[\\/]/.test(fileName) || !fileName.endsWith(".json"))
		throw new Error("Choose an invalid file from this app's listing");
	z.object({ deleted: z.literal(true) }).parse(
		await callAppTestPixel(
			`DeleteAppTestRecording(project=${JSON.stringify([appId])}, fileName=${JSON.stringify([fileName])});`,
		),
	);
};

/** Public fixture settings; credentials and runtime connection paths never belong here. */
export const appTestDatabaseSchema = z.object({
	enabled: z.boolean(),
	sourceEngineId: z.string().default(""),
	schemaSql: z.string().default(""),
	seedSql: z.string().default(""),
});
export type AppTestDatabaseConfiguration = z.infer<
	typeof appTestDatabaseSchema
>;

/** Reject stale or cross-app settings before populating the editor. */
export const parseAppTestDatabase = (
	appId: string,
	value: unknown,
): AppTestDatabaseConfiguration => {
	const result = z
		.object({
			target: z.literal(appId),
			configuration: appTestDatabaseSchema,
		})
		.parse(value);
	return result.configuration;
};

/** Read the current mode before starting a manual recording. */
export const getAppTestDatabase = async (
	appId: string,
): Promise<AppTestDatabaseConfiguration> =>
	parseAppTestDatabase(
		appId,
		await callAppTestPixel(
			`ManageAppTestDatabase(project=${JSON.stringify([appId])}, action=["get"]);`,
		),
	);

/** Validate the fixture on the server before enabling it for every subsequent test. */
export const saveAppTestDatabase = async (
	appId: string,
	configuration: AppTestDatabaseConfiguration,
): Promise<AppTestDatabaseConfiguration> =>
	parseAppTestDatabase(
		appId,
		await callAppTestPixel(
			`ManageAppTestDatabase(project=${JSON.stringify([appId])}, action=["save"], configuration=${JSON.stringify([configuration])});`,
		),
	);

export interface AppTestDatabasePreview {
	target: string;
	environmentId: string;
	expiresAt: string;
	previewPath: string;
	mode: "ISOLATED_H2";
}

/** Start a disposable preview for recording; its relative URL is a temporary capability. */
export const openAppTestDatabase = async (
	appId: string,
): Promise<AppTestDatabasePreview> => {
	const result = z
		.object({
			target: z.literal(appId),
			environmentId: z.uuid(),
			expiresAt: z.iso.datetime(),
			previewPath: z.string(),
			mode: z.literal("ISOLATED_H2"),
		})
		.parse(
			await callAppTestPixel(
				`ManageAppTestDatabase(project=${JSON.stringify([appId])}, action=["open"]);`,
			),
		);
	const prefix = `app-test-preview/${result.environmentId}/`;
	if (
		!result.previewPath.startsWith(prefix) ||
		!/^app-test-preview\/[a-f0-9-]+\/[a-f0-9-]+\/public_home\/[a-zA-Z0-9_-]+\/portals\/$/.test(
			result.previewPath,
		) ||
		!result.previewPath.endsWith(`/public_home/${appId}/portals/`)
	)
		throw new Error("Invalid test preview address");
	return result;
};

/** Revoke the preview capability and dispose its H2 database. */
export const closeAppTestDatabase = async (
	appId: string,
	environmentId: string,
): Promise<void> => {
	z.object({ target: z.literal(appId), closed: z.literal(true) }).parse(
		await callAppTestPixel(
			`ManageAppTestDatabase(project=${JSON.stringify([appId])}, action=["close"], environmentId=${JSON.stringify([environmentId])});`,
		),
	);
};
