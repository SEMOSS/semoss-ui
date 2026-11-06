import { afterEach, expect, test, vi } from "vitest";
import { Env } from "../env";
import { download, setDownloadHandler } from "./file";

afterEach(() => {
	setDownloadHandler(null);
	Env.update({ MODULE: "" });
});

test("a host's download handler saves the file instead of the browser link", async () => {
	Env.update({ MODULE: "https://host/Monolith" });
	const handler = vi.fn().mockResolvedValue(undefined);
	setDownloadHandler(handler);

	await download("insight-1", "a b.docx");

	expect(handler).toHaveBeenCalledWith({
		url: "https://host/Monolith/api/engine/downloadFile?insightId=insight-1&fileKey=a%20b.docx",
		insightId: "insight-1",
		fileKey: "a b.docx",
	});
});

test("a handler's failure reaches the caller", async () => {
	setDownloadHandler(() => Promise.reject(new Error("cancelled")));
	await expect(download("insight-1", "key")).rejects.toThrow("cancelled");
});

test("an insight is required", async () => {
	await expect(download("", "key")).rejects.toThrow("No Insight ID");
});
