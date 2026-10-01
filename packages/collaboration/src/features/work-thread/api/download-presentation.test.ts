import { download } from "@semoss/sdk";
import type { InsightActions } from "@/lib/pixel";
import { downloadPresentation } from "./download-presentation";

vi.mock("@semoss/sdk", () => ({ download: vi.fn() }));

const run = vi.fn();
const actions = { run } as unknown as InsightActions;
beforeEach(() => vi.resetAllMocks());

it("downloads with the key from the owning insight", async () => {
	run.mockResolvedValue({ pixelReturn: [{ output: "download-key" }] });
	await downloadPresentation(actions, "thread-insight", "decks/review.pptx");
	expect(run).toHaveBeenCalledExactlyOnceWith(
		'DownloadInsightAsset(filePath=["decks/review.pptx"]);',
	);
	expect(download).toHaveBeenCalledExactlyOnceWith(
		"thread-insight",
		"download-key",
	);
});

it.each([
	{ pixelReturn: [{ output: "Access denied", operationType: ["ERROR"] }] },
	{ pixelReturn: [{ output: "" }] },
	{ pixelReturn: [] },
])(
	"does not download after an invalid or failed file response",
	async (response) => {
		run.mockResolvedValue(response);
		await expect(
			downloadPresentation(actions, "thread-insight", "review.pptx"),
		).rejects.toThrow();
		expect(download).not.toHaveBeenCalled();
	},
);
