import { uploadRoomFiles } from "@/features/rooms/api/upload-room-files";
import { EmailDraftSession } from "./email-draft-session";
import { saveEmailDraft, UncertainDraftError } from "./microsoft";

const sdk = vi.hoisted(() => ({
	initialize: vi.fn(),
	destroy: vi.fn(),
	actions: { run: vi.fn() },
}));
vi.mock("@semoss/sdk", () => ({
	Insight: class {
		insightId = "draft-only-insight";
		isReady = false;
		actions = sdk.actions;
		initialize = async (options: unknown) => {
			await sdk.initialize(options);
			this.isReady = true;
		};
		destroy = sdk.destroy;
	},
}));
vi.mock("@/features/rooms/api/upload-room-files", () => ({
	uploadRoomFiles: vi.fn(),
}));
vi.mock("./microsoft", () => ({
	saveEmailDraft: vi.fn(),
	UncertainDraftError: class extends Error {
		constructor(cause: Error) {
			super(cause.message);
		}
	},
}));

const draft = {
	mode: "new" as const,
	to: "",
	cc: "",
	bcc: "",
	subject: "",
	body: "Draft text",
};

beforeEach(() => {
	sdk.initialize.mockReset().mockResolvedValue(undefined);
	sdk.destroy.mockReset().mockResolvedValue(undefined);
	vi.mocked(saveEmailDraft)
		.mockReset()
		.mockResolvedValue({ savedDraftId: "saved" });
	vi.mocked(uploadRoomFiles)
		.mockReset()
		.mockImplementation(async (_insightId, files) =>
			files.map((file) => ({
				fileName: file.name,
				fileLocation: `/${file.name}`,
			})),
		);
});

it("uploads same-name files with distinct names and saves their paths in that exact unbound insight", async () => {
	const session = new EmailDraftSession();
	const files = [
		new File(["one"], "report.pdf"),
		new File(["two"], "report.pdf"),
	];
	await session.save(draft, files);
	expect(sdk.initialize).toHaveBeenCalledWith({ disableRoom: true });
	const uploads = vi.mocked(uploadRoomFiles).mock.calls;
	expect(uploads).toHaveLength(2);
	expect(uploads.every(([id]) => id === "draft-only-insight")).toBe(true);
	const names = uploads.map(([, selected]) => selected[0]?.name);
	expect(new Set(names).size).toBe(2);
	expect(names.every((name) => name?.endsWith("-report.pdf"))).toBe(true);
	expect(files.map((file) => file.name)).toEqual([
		"report.pdf",
		"report.pdf",
	]);
	expect(saveEmailDraft).toHaveBeenCalledWith(sdk.actions, {
		...draft,
		attachments: names,
	});
	session.dispose();
});

it("retains successful files after a partial upload failure and honors removal on retry", async () => {
	const session = new EmailDraftSession();
	const first = new File(["one"], "first.txt");
	const second = new File(["two"], "second.txt");
	vi.mocked(uploadRoomFiles)
		.mockImplementationOnce(async (_id, files) =>
			files.map((file) => ({
				fileName: file.name,
				fileLocation: `/${file.name}`,
			})),
		)
		.mockRejectedValueOnce(new Error("Upload failed"));
	await expect(session.save(draft, [first, second])).rejects.toThrow(
		"Upload failed",
	);
	expect(saveEmailDraft).not.toHaveBeenCalled();
	await session.save(draft, [first]);
	expect(uploadRoomFiles).toHaveBeenCalledTimes(2);
	expect(saveEmailDraft).toHaveBeenCalledWith(sdk.actions, {
		...draft,
		attachments: [vi.mocked(uploadRoomFiles).mock.calls[0]?.[1][0]?.name],
	});
	session.dispose();
});

it("retains staged attachments when a draft save fails", async () => {
	const session = new EmailDraftSession();
	const file = new File(["contents"], "notes.txt");
	vi.mocked(saveEmailDraft).mockRejectedValueOnce(new Error("Save failed"));
	await expect(session.save(draft, [file])).rejects.toThrow("Save failed");
	await session.save({ ...draft, body: "Edited" }, [file]);
	expect(uploadRoomFiles).toHaveBeenCalledTimes(1);
	expect(saveEmailDraft).toHaveBeenLastCalledWith(
		sdk.actions,
		expect.objectContaining({
			body: "Edited",
			attachments: expect.any(Array),
		}),
	);
	session.dispose();
});

it("does not destroy pending draft files or allow a second save", async () => {
	const session = new EmailDraftSession();
	let finish: ((value: { savedDraftId: string }) => void) | undefined;
	vi.mocked(saveEmailDraft).mockReturnValueOnce(
		new Promise((resolve) => {
			finish = resolve;
		}),
	);
	const pending = session.save(draft, [new File(["file"], "brief.txt")]);
	await vi.waitFor(() => expect(saveEmailDraft).toHaveBeenCalledTimes(1));
	await expect(session.save(draft, [])).rejects.toThrow(
		"already being saved",
	);
	session.dispose();
	expect(sdk.destroy).not.toHaveBeenCalled();
	finish?.({ savedDraftId: "saved" });
	await pending;
	expect(sdk.destroy).toHaveBeenCalledTimes(1);
});

it("rejects a mismatched upload receipt before creating a draft", async () => {
	const session = new EmailDraftSession();
	vi.mocked(uploadRoomFiles).mockResolvedValueOnce([
		{ fileName: "other-file.txt", fileLocation: "/other-file.txt" },
	]);
	await expect(
		session.save(draft, [new File(["file"], "brief.txt")]),
	).rejects.toThrow("could not be confirmed");
	expect(saveEmailDraft).not.toHaveBeenCalled();
	session.dispose();
});

it("retains files after an uncertain save because a rejected transport does not prove backend completion", async () => {
	const session = new EmailDraftSession();
	vi.mocked(saveEmailDraft).mockRejectedValueOnce(
		new UncertainDraftError(new Error("Response lost")),
	);
	await expect(
		session.save(draft, [new File(["file"], "brief.txt")]),
	).rejects.toThrow("Response lost");
	session.dispose();
	expect(sdk.destroy).not.toHaveBeenCalled();
});
