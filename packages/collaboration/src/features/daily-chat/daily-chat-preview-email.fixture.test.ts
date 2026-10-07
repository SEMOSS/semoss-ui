import { mailSchema } from "@/features/connectors/api/microsoft-schemas";
import {
	replyRecipientsPixel,
	replyRecipientsResponseSchema,
} from "@/features/connectors/api/reply-recipients";
import { roomSourceSchema } from "@/features/rooms/source-import/room-source";
import {
	installEmailPreviewTransport,
	previewEmailRoomSource,
	readPreviewSourceEmail,
} from "./daily-chat-preview-email.fixture";

it("provides validated source email and reply-envelope sample data", () => {
	expect(roomSourceSchema.safeParse(previewEmailRoomSource).success).toBe(
		true,
	);
	const email = readPreviewSourceEmail(
		replyRecipientsPixel("preview-source-email"),
	);
	expect(mailSchema.safeParse(email).success).toBe(true);
	expect(replyRecipientsResponseSchema.parse(email).replyRecipients).toEqual({
		to: ["carla.jimenez@example.invalid"],
		cc: ["dana.osei@example.invalid"],
	});
	expect(email.displayBody?.contentType).toBe("html");
});

it("answers the SDK recipient read locally and blocks writes and uploads", async () => {
	const originalFetch = window.fetch;
	const backendFetch = vi.fn<typeof window.fetch>();
	window.fetch = backendFetch;
	const restore = installEmailPreviewTransport();
	try {
		const read = await window.fetch("/Monolith/api/engine/runPixel", {
			method: "POST",
			body: new URLSearchParams({
				expression: replyRecipientsPixel("preview-source-email"),
			}).toString(),
		});
		expect(read.status).toBe(200);
		const result = await read.json();
		expect(result.pixelReturn[0].output.replyRecipients.to).toEqual([
			"carla.jimenez@example.invalid",
		]);
		for (const [path, expression] of [
			["/Monolith/api/engine/runPixel", "MicrosoftOutlookSendDraft();"],
			["/Monolith/api/uploadFile/baseUpload", ""],
			[
				"/Monolith/api/engine/runPixel",
				replyRecipientsPixel("another-email"),
			],
		]) {
			const response = await window.fetch(path, {
				method: "POST",
				body: new URLSearchParams({ expression }).toString(),
			});
			expect(response.status).toBe(403);
		}
		expect(backendFetch).not.toHaveBeenCalled();
	} finally {
		restore();
		window.fetch = originalFetch;
	}
});
