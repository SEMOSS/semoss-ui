import { readAgentEmailAttachment } from "./agent-email-attachments";

const attachment = {
	path: ".email-attachments/file-1/hello.txt",
	name: "hello.txt",
	size: 5,
	sha256: "a".repeat(64),
};
const receipt = {
	path: attachment.path,
	name: attachment.name,
	size: 5,
	contentBase64: btoa("hello"),
};
const response = (output: unknown) => ({
	pixelReturn: [{ output, operationType: ["MAP"] }],
});

it("reads the verified room snapshot directly into a named file", async () => {
	const run = vi.fn().mockResolvedValue(response(receipt));
	const file = await readAgentEmailAttachment({ run } as never, attachment);
	expect(file.name).toBe("hello.txt");
	expect(file.size).toBe(5);
	expect(run.mock.calls[0]?.[0]).toContain("WorkReadEmailAttachment(");
	expect(run.mock.calls[0]?.[0]).toContain(`sha256=["${attachment.sha256}"]`);
});

it.each([
	{ ...receipt, path: ".email-attachments/file-2/hello.txt" },
	{ ...receipt, name: "other.txt" },
	{ ...receipt, size: 4 },
	{ ...receipt, contentBase64: btoa("hel") },
])("rejects a mismatched or incomplete attachment receipt", async (output) => {
	const run = vi.fn().mockResolvedValue(response(output));
	await expect(
		readAgentEmailAttachment({ run } as never, attachment),
	).rejects.toThrow();
});
