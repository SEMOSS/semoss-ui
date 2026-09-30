import type { InsightActions } from "@/lib/pixel";
import { EmailDraftEditor } from "./email-draft-editor";
import {
	saveEmailDraft,
	sendEmailDraft,
	UncertainSendError,
} from "./microsoft";

vi.mock("./microsoft", async (original) => ({
	...(await original<typeof import("./microsoft")>()),
	saveEmailDraft: vi.fn(),
	sendEmailDraft: vi.fn(),
}));
const actions = {} as InsightActions;
const create = () =>
	new EmailDraftEditor({
		id: "new",
		mode: "new",
		to: "recipient@example.com",
		body: "Ready for review",
	});
beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(saveEmailDraft).mockResolvedValue({ savedDraftId: "saved-1" });
	vi.mocked(sendEmailDraft).mockResolvedValue({
		sent: true,
		draftId: "saved-1",
	});
});
it("saves without sending, then sends the exact saved draft only once", async () => {
	const editor = create();
	await editor.save(actions, editor.getSnapshot().values);
	expect(sendEmailDraft).not.toHaveBeenCalled();
	expect(await editor.send(actions, editor.getSnapshot().values)).toBe(true);
	expect(saveEmailDraft).toHaveBeenCalledTimes(1);
	expect(sendEmailDraft).toHaveBeenCalledWith(actions, "saved-1");
	expect(await editor.send(actions, editor.getSnapshot().values)).toBe(false);
	expect(sendEmailDraft).toHaveBeenCalledTimes(1);
});
it("saves edited content before sending its new receipt", async () => {
	const editor = create();
	await editor.save(actions, editor.getSnapshot().values);
	vi.mocked(saveEmailDraft).mockResolvedValue({ savedDraftId: "saved-2" });
	editor.setValues({
		...editor.getSnapshot().values,
		body: "<p>My revised reply</p>",
	});
	await editor.send(actions, editor.getSnapshot().values);
	expect(sendEmailDraft).toHaveBeenCalledWith(actions, "saved-2");
});
it("locks uncertain sends and retries the same saved identity only after review", async () => {
	const editor = create();
	vi.mocked(sendEmailDraft).mockRejectedValueOnce(
		new UncertainSendError(new Error("Connection lost")),
	);
	expect(await editor.send(actions, editor.getSnapshot().values)).toBe(false);
	editor.setValues({ ...editor.getSnapshot().values, body: "Changed" });
	expect(editor.getSnapshot().values.body).toContain("Ready for review");
	expect(await editor.send(actions, editor.getSnapshot().values)).toBe(false);
	editor.allowRetry();
	expect(await editor.send(actions, editor.getSnapshot().values)).toBe(true);
	expect(saveEmailDraft).toHaveBeenCalledTimes(1);
	expect(sendEmailDraft).toHaveBeenCalledTimes(2);
});
it("rejects duplicate sends during a pending save and requires recipients", async () => {
	const editor = create();
	let finish!: (value: { savedDraftId: string }) => void;
	vi.mocked(saveEmailDraft).mockReturnValue(
		new Promise((resolve) => {
			finish = resolve;
		}),
	);
	const sending = editor.send(actions, editor.getSnapshot().values);
	expect(await editor.send(actions, editor.getSnapshot().values)).toBe(false);
	finish({ savedDraftId: "saved-1" });
	await sending;
	expect(sendEmailDraft).toHaveBeenCalledTimes(1);
	const empty = new EmailDraftEditor({ id: "empty", mode: "new" });
	expect(await empty.send(actions, empty.getSnapshot().values)).toBe(false);
	expect(empty.getSnapshot().error).toMatch(/recipient/);
});
