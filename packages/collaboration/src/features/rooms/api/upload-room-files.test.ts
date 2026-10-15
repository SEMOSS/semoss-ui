const uploadInsightMock = vi.hoisted(() => vi.fn());

vi.mock("@semoss/sdk", () => ({
	uploadInsight: uploadInsightMock,
}));

import { uploadRoomFiles } from "./upload-room-files";

describe("uploadRoomFiles", () => {
	it("uploads all files into the active insight", async () => {
		const file = new File(["contents"], "brief.txt");
		uploadInsightMock.mockResolvedValue({
			data: [
				{ fileName: "brief.txt", fileLocation: "/uploads/brief.txt" },
			],
		});

		await expect(uploadRoomFiles("insight-1", [file])).resolves.toEqual([
			{ fileName: "brief.txt", fileLocation: "/uploads/brief.txt" },
		]);
		expect(uploadInsightMock).toHaveBeenCalledWith("insight-1", "", [file]);
	});

	it("rejects incomplete upload responses", async () => {
		uploadInsightMock.mockResolvedValue({ data: [] });

		await expect(
			uploadRoomFiles("insight-1", [new File(["contents"], "brief.txt")]),
		).rejects.toThrow("One or more attachments could not be uploaded.");
	});
});
