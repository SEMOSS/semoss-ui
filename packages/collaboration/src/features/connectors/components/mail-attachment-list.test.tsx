import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { downloadMailAttachmentIsolated } from "../api/mail-attachment-download";
import { stageMailAttachment } from "../api/microsoft";
import { MailAttachmentList } from "./mail-attachment-list";

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: {}, insightId: "shell-insight" }),
}));
vi.mock("../api/microsoft", () => ({
	stageMailAttachment: vi.fn(),
}));
vi.mock("../api/mail-attachment-download", () => ({
	downloadMailAttachmentIsolated: vi.fn(),
}));

it("isolates downloads and stages only explicit use in the caller's thread insight", async () => {
	const user = userEvent.setup();
	const actions = { run: vi.fn() } as never;
	const onStaged = vi.fn();
	const file = {
		insightId: "thread-insight",
		sourceUid: "mail",
		attachmentId: "file",
		filePath: "unique-report.pdf",
		name: "report.pdf",
		size: 100,
	};
	vi.mocked(stageMailAttachment).mockResolvedValue(file);
	vi.mocked(downloadMailAttachmentIsolated).mockResolvedValue();
	render(
		<MailAttachmentList
			sourceUid="mail"
			attachments={[{ id: "file", name: "report.pdf", isFile: true }]}
			insight={{ insightId: "thread-insight", actions }}
			onStaged={onStaged}
		/>,
	);
	await user.click(
		screen.getByRole("button", { name: "Download report.pdf" }),
	);
	await waitFor(() =>
		expect(downloadMailAttachmentIsolated).toHaveBeenCalledWith(
			{ insightId: "shell-insight", actions: {} },
			"mail",
			{ id: "file", name: "report.pdf", isFile: true },
		),
	);
	expect(stageMailAttachment).not.toHaveBeenCalled();
	expect(onStaged).not.toHaveBeenCalled();
	await user.click(screen.getByRole("button", { name: "Use in thread" }));
	expect(stageMailAttachment).toHaveBeenCalledWith(
		actions,
		"thread-insight",
		"mail",
		"file",
		"report.pdf",
	);
	expect(onStaged).toHaveBeenCalledWith(file);
	await user.click(screen.getByRole("button", { name: "Use in thread" }));
	expect(stageMailAttachment).toHaveBeenCalledTimes(1);
});
