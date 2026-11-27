import { beforeEach, describe, expect, it, vi } from "vitest";
import { runPixel } from "./base";
import {
	createEmbeddingsFromDocuments,
	downloadVectorFile,
	getEngineAsset,
	getEngineAssetBase64,
	listKnowledgeEngines,
	listVectorDocuments,
} from "./knowledge";

vi.mock("./base", () => ({
	runPixel: vi.fn(),
}));

const mockRunPixel = vi.mocked(runPixel);

/** A pixel response with the given statements and errors. */
const answer = (pixelReturn: { output: unknown }[], errors: string[] = []) =>
	({
		errors: errors,
		insightId: "insight-1",
		pixelReturn: pixelReturn,
	}) as unknown as Awaited<ReturnType<typeof runPixel>>;

beforeEach(() => {
	mockRunPixel.mockReset();
});

describe("listKnowledgeEngines", () => {
	it("reads every source, one source, or the sources with some tags", async () => {
		const engines = [{ engine_id: "kb-1", engine_name: "Notes" }];
		mockRunPixel.mockResolvedValue(answer([{ output: engines }]));

		await expect(listKnowledgeEngines("insight-1")).resolves.toEqual(
			engines,
		);
		await listKnowledgeEngines("insight-1", { engineId: "kb-1" });
		await listKnowledgeEngines("insight-1", { tags: ["FDA", "CDER"] });

		expect(mockRunPixel.mock.calls).toEqual([
			[
				`MyEngines ( engineTypes = [ 'VECTOR' ], metaKeys = ["description", "tag"])`,
				"insight-1",
			],
			[
				`MyEngines(engine=["kb-1"], engineTypes=['VECTOR'], metaKeys=["description","tag"], userT=[true], limit=[1], offset=[0]);`,
				"insight-1",
			],
			[
				`MyEngines ( engineTypes = [ 'VECTOR' ], metaKeys = ["description", "tag"],  metaFilters=[{"tag":["FDA","CDER"]}])`,
				"insight-1",
			],
		]);
	});

	it("reads no sources as an empty list and throws what the backend reports", async () => {
		mockRunPixel.mockResolvedValueOnce(answer([]));
		await expect(listKnowledgeEngines("insight-1")).resolves.toEqual([]);

		mockRunPixel.mockResolvedValueOnce(answer([], ["No access"]));
		await expect(listKnowledgeEngines("insight-1")).rejects.toThrow(
			"No access",
		);
	});
});

describe("documents", () => {
	it("lists a source's documents", async () => {
		const documents = [
			{
				fileName: "a.pdf",
				fileSize: 12.5,
				lastModified: "2026-01-02 03:04:05",
			},
		];
		mockRunPixel.mockResolvedValue(answer([{ output: documents }]));

		await expect(listVectorDocuments("insight-1", "kb-1")).resolves.toEqual(
			documents,
		);
		expect(mockRunPixel).toHaveBeenCalledWith(
			'ListDocumentsInVectorDatabase(engine=["kb-1"]);',
			"insight-1",
		);
	});

	it("reads a document as text or base64, and prepares its download", async () => {
		mockRunPixel.mockResolvedValue(answer([{ output: "content" }]));

		await expect(
			getEngineAsset(
				"insight-1",
				"kb-1",
				"/schema/default/documents/a.txt",
			),
		).resolves.toBe("content");
		await expect(
			getEngineAssetBase64(
				"insight-1",
				"kb-1",
				"/schema/default/documents/a.pdf",
			),
		).resolves.toBe("content");
		await expect(
			downloadVectorFile("insight-1", "kb-1", "a.pdf"),
		).resolves.toBe("content");

		expect(mockRunPixel.mock.calls).toEqual([
			[
				'GetEngineAssets(filePath=["/schema/default/documents/a.txt"], engine=["kb-1"]);',
				"insight-1",
			],
			[
				'GetEngineAssetsBase64(filePath=["/schema/default/documents/a.pdf"], engine=["kb-1"]);',
				"insight-1",
			],
			[
				'META | VectorFileDownload(engine = "kb-1", fileNames=["a.pdf"]);',
				"insight-1",
			],
		]);
	});

	it("embeds uploaded files and throws what the backend reports", async () => {
		mockRunPixel.mockResolvedValueOnce(answer([{ output: {} }]));
		await createEmbeddingsFromDocuments("insight-1", "kb-1", [
			"/up/a.pdf",
			"/up/b.txt",
		]);
		expect(mockRunPixel).toHaveBeenCalledWith(
			'CreateEmbeddingsFromDocuments(engine=["kb-1"], filePaths=["/up/a.pdf", "/up/b.txt"]);',
			"insight-1",
		);

		mockRunPixel.mockResolvedValueOnce(answer([], ["Embedding failed"]));
		await expect(
			createEmbeddingsFromDocuments("insight-1", "kb-1", ["/up/a.pdf"]),
		).rejects.toThrow("Embedding failed");
	});
});
