import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { saveMailAttachments } from "@semoss/connectors";
import {
	attachmentsSummary,
	useTwinMailAttachments,
} from "./use-twin-mail-attachments";

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ insightId: "insight-1" }),
}));
vi.mock("@semoss/connectors", () => ({ saveMailAttachments: vi.fn() }));
const save = vi.mocked(saveMailAttachments);

const thread = (id: string) => ({
	service: "outlook-mail" as const,
	itemKey: `conversation:${id}`,
});
const file = (name: string) => ({
	path: name,
	name,
	service: "outlook-mail" as const,
});

beforeEach(() => {
	// in a block: a function a hook returns is run after the test, and the mock is one
	save.mockReset();
});
afterEach(cleanup);

it("says what adding attachments did: how many, none, and what was left out", () => {
	const added = (what: string) => `Added ${what}.`;
	expect(attachmentsSummary(0, [], added)).toBe(
		"There were no attachments to add.",
	);
	expect(attachmentsSummary(1, [], added)).toBe("Added 1 attachment.");
	expect(attachmentsSummary(3, ["Big.mp4"], added)).toBe(
		"Added 3 attachments. Left out for being over 25 MB: Big.mp4.",
	);
	// nothing went in, and it says why instead of saying there were none
	expect(
		attachmentsSummary(0, ["Big.mp4", "Huge.mov", "Big.mp4"], added),
	).toBe("Left out for being over 25 MB: Big.mp4, Huge.mov.");
});

it("remembers each email added once, and nothing that is not an email's thread", () => {
	const { result } = renderHook(() => useTwinMailAttachments());
	act(() => {
		result.current.offer(thread("conv-1"));
		result.current.offer(thread("conv-1"));
		// a file attached to an email, a chat, and an upload
		result.current.offer({ service: "outlook-mail", itemKey: "m-1:a-1" });
		result.current.offer({ service: "teams-chats", itemKey: "19:chat" });
		result.current.offer({});
		result.current.offer(thread("conv-2"));
	});
	expect(result.current.pending).toBe(2);
});

it("saves every remembered email's attachments, then forgets the emails", async () => {
	save.mockImplementation(async (_insightId, conversationId) => ({
		saved: [file(`${conversationId}.docx`)],
		skipped: conversationId === "conv-2" ? ["Big.mp4"] : [],
	}));
	const { result } = renderHook(() => useTwinMailAttachments());
	act(() => {
		result.current.offer(thread("conv-1"));
		result.current.offer(thread("conv-2"));
	});
	let found: Awaited<ReturnType<typeof result.current.save>> | undefined;
	await act(async () => {
		found = await result.current.save();
	});
	expect(found).toEqual({
		saved: [file("conv-1.docx"), file("conv-2.docx")],
		skipped: ["Big.mp4"],
	});
	expect(save.mock.calls).toEqual([
		["insight-1", "conv-1"],
		["insight-1", "conv-2"],
	]);
	expect(result.current.pending).toBe(0);
	expect(result.current.isSaving).toBe(false);
});

it("keeps the emails to try again when one could not be read", async () => {
	save.mockRejectedValue(new Error("Sign in to Microsoft"));
	const { result } = renderHook(() => useTwinMailAttachments());
	act(() => result.current.offer(thread("conv-1")));
	await act(async () => {
		await expect(result.current.save()).rejects.toThrow(
			"Sign in to Microsoft",
		);
	});
	expect(result.current.pending).toBe(1);
	expect(result.current.isSaving).toBe(false);
});
