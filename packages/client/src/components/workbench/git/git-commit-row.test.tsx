import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FILE_PANEL_EVENTS } from "@semoss/panels";
import { runPixel } from "@semoss/sdk";
import { toast } from "@semoss/ui/next";
import { GitCommitRow } from "@/components/git";
import { WORKBENCH_EVENTS } from "@/stores/workbench";
import { GitCommitRowAdapter } from "./git-commit-row";

const { emit } = vi.hoisted(() => ({ emit: vi.fn() }));
const RESOURCE_ID = "resource-1";

vi.mock("@semoss/sdk", () => ({ runPixel: vi.fn() }));
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ insightId: "insight-1" }),
	usePixel: () => ({ data: [], status: "SUCCESS" }),
}));
vi.mock("@semoss/ui/next", () => ({ toast: { warning: vi.fn() } }));
vi.mock("@semoss/panels", () => ({
	FILE_PANEL_TYPES: {},
	FILE_PANEL_EVENTS: { FILES_CHANGED: "files:changed" },
	getFilePanelScope: () => "resource-scope",
}));
vi.mock("@semoss/workbench", () => ({
	useWorkbench: (selector: (state: unknown) => unknown) =>
		selector({ layout: { actions: {} }, events: { actions: { emit } } }),
}));
vi.mock("@/components/git", () => ({ GitCommitRow: vi.fn(() => null) }));

/** Build the backend response for a completed restore or build warning. */
const response = (output: boolean | string, operationType = "BOOLEAN") => ({
	errors: [],
	insightId: "insight-1",
	pixelReturn: [
		{
			isMeta: false,
			operationType: [operationType],
			output,
			pixelExpression: "ProjectCommitRestore();",
			pixelId: "0",
			timeToRun: 0,
		},
	],
});

/** Render the adapter and expose the restore action passed to its Git row. */
const renderAdapter = (
	type: "PROJECT" | "ENGINE" = "PROJECT",
	canRestore = true,
) => {
	render(
		<GitCommitRowAdapter
			type={type}
			id={RESOURCE_ID}
			canRestore={canRestore}
			commit={{
				commitId: "abcdef123456",
				commitMessage: "Previous app version",
				author: { userId: "author", userEmail: "author@example.com" },
				date: "2026-09-21T12:00:00Z",
				parentCommitIds: [],
			}}
			onRestored={vi.fn()}
		/>,
	);
	const props = vi.mocked(GitCommitRow).mock.lastCall?.[0];
	if (!props) throw new Error("Git row was not rendered");
	return props;
};

describe("Git commit restore in the workbench", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(runPixel).mockResolvedValue(response(true));
	});
	afterEach(cleanup);

	it("refreshes the preview only after project restore and its backend build finish", async () => {
		let finishRestore:
			| ((value: ReturnType<typeof response>) => void)
			| undefined;
		const pending = new Promise<ReturnType<typeof response>>((resolve) => {
			finishRestore = resolve;
		});
		vi.mocked(runPixel).mockReturnValue(pending);
		const restoring = renderAdapter().onRestore?.();

		expect(emit).not.toHaveBeenCalled();
		if (!finishRestore)
			throw new Error("Restore request was not initialized");
		finishRestore(response(true));
		await restoring;

		expect(runPixel).toHaveBeenCalledExactlyOnceWith(
			'ProjectCommitRestore(project=["resource-1"], commitId=["abcdef123456"]);',
			"insight-1",
		);
		expect(emit.mock.calls).toEqual([
			[FILE_PANEL_EVENTS.FILES_CHANGED, { scope: "resource-scope" }],
			[WORKBENCH_EVENTS.APP_PUBLISHED, { projectId: "resource-1" }],
		]);
	});

	it("refreshes files and reports a build warning without refreshing the published app", async () => {
		const warning =
			"Project source was restored, but its app could not be rebuilt and published: Build failed";
		vi.mocked(runPixel).mockResolvedValue(response(warning, "WARNING"));
		await renderAdapter().onRestore?.();

		expect(emit.mock.calls).toEqual([
			[FILE_PANEL_EVENTS.FILES_CHANGED, { scope: "resource-scope" }],
		]);
		expect(toast.warning).toHaveBeenCalledWith(warning);
	});

	it("refreshes engine files without publishing an app", async () => {
		await renderAdapter("ENGINE").onRestore?.();

		expect(runPixel).toHaveBeenCalledExactlyOnceWith(
			'EngineCommitRestore(engine=["resource-1"], commitId=["abcdef123456"]);',
			"insight-1",
		);
		expect(emit.mock.calls).toEqual([
			[FILE_PANEL_EVENTS.FILES_CHANGED, { scope: "resource-scope" }],
		]);
	});

	it("does not announce changes when restoration fails", async () => {
		vi.mocked(runPixel).mockResolvedValue({
			...response("Commit not found", "ERROR"),
			errors: ["Commit not found"],
		});

		await expect(renderAdapter().onRestore?.()).rejects.toThrow(
			"Commit not found",
		);
		expect(emit).not.toHaveBeenCalled();
	});

	it.each([false, undefined])(
		"rejects an unsuccessful or missing restore result (%s)",
		async (output) => {
			vi.mocked(runPixel).mockResolvedValue({
				...response(false),
				pixelReturn:
					output === undefined ? [] : response(output).pixelReturn,
			});

			await expect(renderAdapter().onRestore?.()).rejects.toThrow();
			expect(emit).not.toHaveBeenCalled();
		},
	);

	it("offers no restore action for read-only resources", () => {
		expect(renderAdapter("PROJECT", false).onRestore).toBeUndefined();
		expect(runPixel).not.toHaveBeenCalled();
	});
});
