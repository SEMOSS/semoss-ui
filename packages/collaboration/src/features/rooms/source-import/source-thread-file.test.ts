import { sourceDocument } from "./source-import.test-fixtures";
import {
	type SourceEmailDraft,
	sourceThreadMarkdown,
} from "./source-thread-file";

const reply: SourceEmailDraft = {
	id: "draft-one",
	replyTo: "mail-one",
	status: "draft",
	subject: "Budget review",
	to: "ada@example.com",
	cc: "",
	bcc: "",
	body: "Latest **reply** <tag>\nNext line",
	attachments: ["Budget.xlsx"],
};

it.each([
	["draft", "Draft — not sent"],
	["saved", "Saved draft — not sent"],
	["sending", "Sending — delivery not yet confirmed"],
	["sent", "## Sent"],
	["uncertain", "status unknown"],
] as const)(
	"labels a %s reply separately from mailbox messages",
	(status, label) => {
		const markdown = sourceThreadMarkdown(sourceDocument(), [
			{ ...reply, status },
		]);
		expect(markdown).toContain("**Messages:** 1");
		expect(markdown).toContain(label);
		expect(markdown).toContain(
			"Latest \\*\\*reply\\*\\* &lt;tag&gt;  \nNext line",
		);
		expect(markdown).toContain("Budget\\.xlsx");
	},
);

it("omits replies to excluded messages and sent copies already in mailbox history", () => {
	const document = sourceDocument();
	const markdown = sourceThreadMarkdown(document, [
		{ ...reply, replyTo: "excluded-mail", body: "Excluded reply" },
		{
			...reply,
			status: "sent",
			savedMessageId: "mail-one",
			body: "Sent copy",
		},
	]);
	expect(markdown).not.toContain("Replies from this chat");
	expect(markdown).not.toContain("Excluded reply");
	expect(markdown).not.toContain("Sent copy");
});
