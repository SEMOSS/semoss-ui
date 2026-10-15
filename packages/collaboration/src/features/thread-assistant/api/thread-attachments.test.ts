import type { InsightActions } from "@/lib/pixel";
import {
	sendsAsText,
	stageThreadAttachment,
	uniqueAttachmentName,
} from "./thread-attachments";

const attachment = {
	id: "att-1",
	name: "Q3 Budget.xlsx",
	isFile: true,
	messageId: "msg-1",
};

function actionsReturning(output: (statement: string) => unknown) {
	const run = vi.fn(async (statement: string) => ({
		pixelReturn: [{ output: output(statement), operationType: [] }],
	}));
	return { run, actions: { run } as unknown as InsightActions };
}

/** The file name the pixel asked for, read back out of the statement. */
function requestedName(statement: string): string {
	const match = /fileName=\["([^"]+)"\]/.exec(statement);
	return match?.[1] ?? "";
}

it("keeps a readable name, adds a short unique suffix, and never leaves the folder", () => {
	expect(uniqueAttachmentName("Q3 Budget.xlsx")).toMatch(
		/^Q3 Budget-[0-9a-f]{6}\.xlsx$/,
	);
	expect(uniqueAttachmentName("../../etc/passwd")).toMatch(
		/^passwd-[0-9a-f]{6}$/,
	);
	expect(uniqueAttachmentName(".hidden")).toMatch(/^hidden-[0-9a-f]{6}$/);
	expect(uniqueAttachmentName("")).toMatch(/^attachment-[0-9a-f]{6}$/);
	expect(uniqueAttachmentName("a:b*c?.pdf")).toMatch(
		/^a_b_c_-[0-9a-f]{6}\.pdf$/,
	);
	expect(uniqueAttachmentName(`${"x".repeat(300)}.pdf`).length).toBeLessThan(
		120,
	);
	expect(uniqueAttachmentName("same.png")).not.toBe(
		uniqueAttachmentName("same.png"),
	);
});

it("sends Office and mail files as text, and everything else as the file", () => {
	for (const name of ["a.docx", "B.XLSX", "deck.pptx", "old.doc", "fwd.eml"])
		expect(sendsAsText(name)).toBe(true);
	for (const name of ["scan.pdf", "photo.png", "notes.txt", "docx"])
		expect(sendsAsText(name)).toBe(false);
});

it("stages through the thread's rules and returns the text copy", async () => {
	const { run, actions } = actionsReturning((statement) => ({
		threadId: "thread-1",
		messageId: "msg-1",
		attachmentId: "att-1",
		name: "Q3 Budget.xlsx",
		size: 2048,
		filePath: requestedName(statement),
		textPath: `${requestedName(statement)}.txt`,
		textTruncated: true,
	}));
	const staged = await stageThreadAttachment(
		actions,
		"insight-1",
		"thread-1",
		attachment,
		true,
	);
	const statement = run.mock.calls[0]?.[0] ?? "";
	expect(statement).toMatch(/^WorkDownloadAttachment\(/);
	expect(statement).toContain('threadId=["thread-1"]');
	expect(statement).toContain('messageId=["msg-1"]');
	expect(statement).toContain('attachmentId=["att-1"]');
	expect(statement).toContain("includeText=[true]");
	expect(staged).toEqual({
		insightId: "insight-1",
		filePath: requestedName(statement),
		name: "Q3 Budget.xlsx",
		size: 2048,
		attachmentId: "att-1",
		sourceUid: "msg-1",
		textPath: `${requestedName(statement)}.txt`,
		isTextTruncated: true,
	});
});

it("rejects a receipt for a different file", async () => {
	const { actions } = actionsReturning(() => ({
		threadId: "thread-1",
		messageId: "msg-1",
		attachmentId: "att-1",
		name: "Q3 Budget.xlsx",
		size: 2048,
		filePath: "someone-else.xlsx",
	}));
	await expect(
		stageThreadAttachment(
			actions,
			"insight-1",
			"thread-1",
			attachment,
			false,
		),
	).rejects.toThrow("does not match the selected file");
});

it("needs a ready insight and an email on the thread", async () => {
	const { run, actions } = actionsReturning(() => ({}));
	await expect(
		stageThreadAttachment(actions, "", "thread-1", attachment, true),
	).rejects.toThrow("A ready workspace is required");
	await expect(
		stageThreadAttachment(
			actions,
			"insight-1",
			"thread-1",
			{ ...attachment, messageId: undefined },
			true,
		),
	).rejects.toThrow("not on an email in this thread");
	expect(run).not.toHaveBeenCalled();
});
