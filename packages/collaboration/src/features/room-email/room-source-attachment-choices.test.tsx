import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import type { WorkspaceMessage } from "@/features/collaboration/state/collaboration.types";
import type { RoomSource } from "@/features/rooms/source-import/room-source";
import { RoomEmailContext } from "./room-email.context";
import { RoomSourceAttachmentChoices } from "./room-source-attachment-choices";
import { stageSourceAttachment } from "./room-source-attachments";

vi.mock("./room-source-attachments", () => ({
	stageSourceAttachment: vi.fn(),
}));

const source = { threadId: "thread-one", kind: "brain" } as RoomSource;
const message: WorkspaceMessage = {
	id: "mail-one",
	fromId: "ana",
	at: "2026-10-07T09:00:00Z",
	text: "Plan attached",
	attachments: [
		{ id: "a1", name: "Plan.docx", isFile: true, messageId: "mail-one" },
		{ id: "a2", name: "Chart.pdf", isFile: true, messageId: "mail-one" },
		{ id: "a3", name: "Shared folder", isFile: false },
	],
};
const session = {
	insight: { insightId: "room-insight", actions: { run: vi.fn() } },
};

function choices(
	props: Partial<ComponentProps<typeof RoomSourceAttachmentChoices>> = {},
) {
	return (
		<RoomEmailContext.Provider
			value={
				{
					source,
					sourceMessages: [message],
					session,
				} as unknown as ComponentProps<
					typeof RoomEmailContext.Provider
				>["value"]
			}
		>
			<RoomSourceAttachmentChoices
				queued={[]}
				onAdd={vi.fn()}
				{...props}
			/>
		</RoomEmailContext.Provider>
	);
}

afterEach(() => vi.clearAllMocks());

it("adds an Office file as its text copy and other files as they are", async () => {
	const user = userEvent.setup();
	const onAdd = vi.fn();
	vi.mocked(stageSourceAttachment)
		.mockResolvedValueOnce({
			insightId: "room-insight",
			filePath: "Plan-1a2b3c.docx",
			textPath: "Plan-1a2b3c.docx.txt",
			name: "Plan.docx",
			size: 10,
			attachmentId: "a1",
			sourceUid: "mail-one",
		})
		.mockResolvedValueOnce({
			insightId: "room-insight",
			filePath: "Chart-4d5e6f.pdf",
			name: "Chart.pdf",
			size: 10,
			attachmentId: "a2",
			sourceUid: "mail-one",
		});
	const { rerender } = render(choices({ onAdd }));
	expect(screen.queryByText("Shared folder")).toBeNull();
	await user.click(screen.getByRole("button", { name: "Add Plan.docx" }));
	await user.click(screen.getByRole("button", { name: "Add Chart.pdf" }));
	expect(stageSourceAttachment).toHaveBeenNthCalledWith(
		1,
		session,
		"thread-one",
		"mail-one",
		message.attachments?.[0],
		true,
	);
	expect(stageSourceAttachment).toHaveBeenLastCalledWith(
		session,
		"thread-one",
		"mail-one",
		message.attachments?.[1],
		false,
	);
	expect(onAdd.mock.calls).toEqual([
		[
			{
				fileLocation: "Plan-1a2b3c.docx.txt",
				fileName: "Plan.docx (text)",
			},
		],
		[{ fileLocation: "Chart-4d5e6f.pdf", fileName: "Chart.pdf" }],
	]);
	rerender(
		choices({
			onAdd,
			queued: [
				{
					fileLocation: "Plan-1a2b3c.docx.txt",
					fileName: "Plan.docx (text)",
				},
			],
		}),
	);
	expect(
		screen.getByRole("button", { name: "Plan.docx added" }),
	).toBeDisabled();
	// removing the chip makes the same copy available again without staging twice
	rerender(choices({ onAdd, queued: [] }));
	await user.click(screen.getByRole("button", { name: "Add Plan.docx" }));
	expect(stageSourceAttachment).toHaveBeenCalledTimes(2);
	expect(onAdd).toHaveBeenCalledTimes(3);
});

it("never sends an Office file without its text", async () => {
	const user = userEvent.setup();
	const onAdd = vi.fn();
	vi.mocked(stageSourceAttachment).mockResolvedValueOnce({
		insightId: "room-insight",
		filePath: "Plan-1a2b3c.docx",
		textError: "The file is password protected.",
		name: "Plan.docx",
		size: 10,
		attachmentId: "a1",
		sourceUid: "mail-one",
	});
	render(choices({ onAdd }));
	await user.click(screen.getByRole("button", { name: "Add Plan.docx" }));
	expect(
		await screen.findByText("The file is password protected."),
	).toBeVisible();
	expect(onAdd).not.toHaveBeenCalled();
});
