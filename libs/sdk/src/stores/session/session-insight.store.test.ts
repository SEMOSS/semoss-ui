import { beforeEach, describe, expect, it, vi } from "vitest";
import { runPixel, runPixelAsync } from "../../api/base";
import { download, upload } from "../../api/file";
import { HttpError } from "../../utility/error";
import { SessionInsightStore } from "./session-insight.store";

vi.mock("../../api/base", async (importOriginal) => ({
	...(await importOriginal<typeof import("../../api/base")>()),
	runPixel: vi.fn(),
	runPixelAsync: vi.fn(),
}));
vi.mock("../../api/file", async (importOriginal) => ({
	...(await importOriginal<typeof import("../../api/file")>()),
	download: vi.fn(),
	upload: vi.fn(),
}));

const mockRunPixel = vi.mocked(runPixel);
const mockRunPixelAsync = vi.mocked(runPixelAsync);
const mockDownload = vi.mocked(download);
const mockUpload = vi.mocked(upload);

/** A pixel's answer, run in the given insight. */
const answer = (insightId: string) => ({
	insightId: insightId,
	errors: [],
	pixelReturn: [],
});

/** The backend's answer for an insight it no longer has. */
const insightNotFound = () =>
	new HttpError("Could not find the insight id", 400, {
		errorType: "INSIGHT_NOT_FOUND",
	});

describe("SessionInsightStore", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockRunPixel.mockImplementation(async (_pixel, insightId) =>
			answer(insightId === "new" ? "insight-1" : String(insightId)),
		);
	});

	it("makes the insight with the first pixel, in one request", async () => {
		const insight = new SessionInsightStore();

		await insight.run("1+1;");
		await insight.run("2+2;");

		expect(mockRunPixel).toHaveBeenNthCalledWith(1, "1+1;", "new");
		expect(mockRunPixel).toHaveBeenNthCalledWith(2, "2+2;", "insight-1");
		expect(insight.getSnapshot().insightId).toBe("insight-1");
	});

	it("runs calls made while the insight is being made in that one insight", async () => {
		const insight = new SessionInsightStore();

		await Promise.all([insight.run("1+1;"), insight.run("2+2;")]);

		expect(mockRunPixel).toHaveBeenCalledTimes(2);
		expect(mockRunPixel).toHaveBeenCalledWith("1+1;", "new");
		expect(mockRunPixel).toHaveBeenCalledWith("2+2;", "insight-1");
	});

	it("keeps the insight a request names, as getUserInfo does", async () => {
		const insight = new SessionInsightStore();

		const result = await insight.withInsight(async (insightId) => ({
			insightId: insightId === "new" ? "from-user-info" : insightId,
		}));

		expect(result.insightId).toBe("from-user-info");
		expect(insight.getSnapshot().insightId).toBe("from-user-info");
		expect(mockRunPixel).not.toHaveBeenCalled();
	});

	it("makes an empty insight for callers waiting on a request that names none", async () => {
		const insight = new SessionInsightStore();

		const first = insight.withInsight(async () => undefined);
		const second = insight.withInsight(async (insightId) => insightId);

		await first;
		expect(await second).toBe("insight-1");
		expect(mockRunPixel).toHaveBeenCalledWith("META | init", "new");
	});

	it("makes the insight before an upload, which the backend requires", async () => {
		mockUpload.mockResolvedValue([]);
		const insight = new SessionInsightStore();
		const file = new File(["text"], "notes.txt");

		await insight.upload(file, "project-1", "docs");

		expect(mockRunPixel).toHaveBeenCalledWith("META | init", "new");
		expect(mockUpload).toHaveBeenCalledWith(
			file,
			"insight-1",
			"project-1",
			"docs",
		);
	});

	it("makes the insight before an async pixel, whose job names none", async () => {
		mockRunPixelAsync.mockResolvedValue({ jobId: "job-1" });
		const insight = new SessionInsightStore();

		await insight.runAsync("1+1;");

		expect(mockRunPixel).toHaveBeenCalledWith("META | init", "new");
		expect(mockRunPixelAsync).toHaveBeenCalledWith("1+1;", "insight-1");
	});

	it("downloads from the insight that made the file", async () => {
		mockDownload.mockResolvedValue(undefined);
		const insight = new SessionInsightStore();
		await insight.run("META | ExportFile();");

		await insight.download("file-1");

		expect(mockDownload).toHaveBeenCalledWith("insight-1", "file-1");
	});

	it("makes a new insight once when the backend no longer has it", async () => {
		const insight = new SessionInsightStore();
		await insight.run("1+1;");

		mockRunPixel
			.mockRejectedValueOnce(insightNotFound())
			.mockResolvedValueOnce(answer("fresh-insight"))
			.mockResolvedValueOnce(answer("fresh-insight"));
		const result = await insight.run("2+2;");

		expect(result.insightId).toBe("fresh-insight");
		expect(mockRunPixel).toHaveBeenCalledWith("META | init", "new");
		expect(mockRunPixel).toHaveBeenLastCalledWith("2+2;", "fresh-insight");
		expect(insight.getSnapshot().insightId).toBe("fresh-insight");
	});

	it("forgets the insight on clear, and drops one still being made", async () => {
		let finish: (value: ReturnType<typeof answer>) => void = () => {};
		mockRunPixel.mockReturnValueOnce(
			new Promise((resolve) => {
				finish = resolve;
			}),
		);
		const insight = new SessionInsightStore();

		const running = insight.run("1+1;");
		insight.clear();
		finish(answer("old-insight"));
		await running;

		expect(insight.getSnapshot().insightId).toBe("");
	});

	it("tells listeners when the insight changes", async () => {
		const insight = new SessionInsightStore();
		const listener = vi.fn();
		insight.subscribe(listener);

		await insight.run("1+1;");
		insight.clear();

		expect(listener).toHaveBeenCalledTimes(2);
	});
});
