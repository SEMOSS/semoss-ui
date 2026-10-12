import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { DraftChatComposer } from "@/features/daily-chat/draft-chat-composer";
import { RoomSession } from "../room-session";
import { RoomContextFiles } from "./room-context-files";

vi.mock("@semoss/i18n", async (original) => ({
	...(await original<typeof import("@semoss/i18n")>()),
	useTranslation: () => ({
		t: (key: string, values?: { name?: string }) =>
			key === "contextItems.remove"
				? `Remove ${values?.name} from your next message`
				: "Added to Your Next Message",
	}),
}));
vi.mock("./room-composer", () => ({
	RoomComposer: ({
		attachmentSummary,
	}: ComponentProps<typeof import("./room-composer")["RoomComposer"]>) =>
		attachmentSummary,
}));
vi.mock("@/features/work-thread/thread-agent-select", () => ({
	ThreadAgentSelect: () => null,
}));

const file = { fileLocation: "email.md", fileName: "Project review email.md" };

it("omits the attachment group for an empty queue", () => {
	render(<RoomContextFiles files={[]} onRemove={vi.fn()} />);
	expect(screen.queryByRole("list")).not.toBeInTheDocument();
});

it("names queued attachments and removes their saved paths", () => {
	const onRemove = vi.fn();
	render(<RoomContextFiles files={[file]} onRemove={onRemove} />);
	expect(
		screen.getByRole("list", { name: "Added to Your Next Message" }),
	).toBeVisible();
	expect(screen.getByText(file.fileName)).toBeVisible();
	fireEvent.click(
		screen.getByRole("button", {
			name: `Remove ${file.fileName} from your next message`,
		}),
	);
	expect(onRemove).toHaveBeenCalledExactlyOnceWith(file.fileLocation);
});

it("keeps the filename visible while removal is unavailable", () => {
	const onRemove = vi.fn();
	render(<RoomContextFiles files={[file]} onRemove={onRemove} isDisabled />);
	const remove = screen.getByRole("button", {
		name: `Remove ${file.fileName} from your next message`,
	});
	expect(remove).toBeDisabled();
	fireEvent.click(remove);
	expect(onRemove).not.toHaveBeenCalled();
	expect(screen.getByText(file.fileName)).toBeVisible();
});

it("shares the removable session queue with the unsaved draft composer", () => {
	const session = new RoomSession("draft-test");
	session.addContextFile(file);
	render(
		<DraftChatComposer
			draftId="local-draft"
			session={session}
			snapshot={{
				...session.getSnapshot(),
				isReady: true,
				isLoading: false,
			}}
			agentError=""
			onInitialize={vi.fn()}
			onSend={vi.fn()}
			onSaveSettings={vi.fn()}
			onSelectAgent={vi.fn()}
			panelActions={[]}
		/>,
	);
	fireEvent.click(
		screen.getByRole("button", {
			name: `Remove ${file.fileName} from your next message`,
		}),
	);
	expect(session.getSnapshot().contextFiles).toEqual([]);
	expect(session.getSnapshot().roomId).toBe("");
	session.dispose();
});
