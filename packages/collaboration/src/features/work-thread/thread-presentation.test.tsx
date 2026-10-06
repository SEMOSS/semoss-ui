import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ConversationTool } from "@/features/messages/types/message";
import { downloadPresentation } from "./api/download-presentation";
import { ThreadPresentation } from "./thread-presentation";

const workbench = vi.hoisted(() => ({
	tools: {} as Record<string, ConversationTool>,
	roomId: "room",
	insightId: "thread-insight",
	openFile: vi.fn(),
	openWorkbench: vi.fn(),
}));
const session = vi.hoisted(() => ({
	insight: { insightId: "thread-insight", actions: { run: vi.fn() } },
}));
vi.mock("@/features/tools/tool-workbench.context", () => ({
	useToolWorkbench: () => workbench,
}));
vi.mock("./work-thread-context", () => ({
	useWorkThread: () => ({ session }),
}));
vi.mock("./api/download-presentation", () => ({
	downloadPresentation: vi.fn(),
}));

const tool: ConversationTool = {
	id: "deck-tool",
	parentMessageId: "response",
	roomId: "room",
	name: "BuildPptx",
	title: "Prepare review",
	arguments: {},
	status: "COMPLETED",
	output: '{"files":[{"path":"decks/review.pptx"}]}',
};

beforeEach(() => {
	vi.resetAllMocks();
	workbench.tools = {};
});

it("stays absent until relevant tool activity exists", () => {
	render(<ThreadPresentation />);
	expect(
		screen.queryByRole("heading", { name: "Presentation" }),
	).not.toBeInTheDocument();
});

it("opens completed room files with the keyboard without making a new request", async () => {
	workbench.tools = { [tool.id]: tool };
	const user = userEvent.setup();
	render(<ThreadPresentation />);
	await user.tab();
	expect(screen.getByRole("button", { name: "View activity" })).toHaveFocus();
	await user.tab();
	expect(
		screen.getByRole("button", { name: "Open review.pptx" }),
	).toHaveFocus();
	await user.keyboard("{Enter}");
	expect(workbench.openFile).toHaveBeenCalledExactlyOnceWith(
		"decks/review.pptx",
		"review.pptx",
	);
	expect(session.insight.actions.run).not.toHaveBeenCalled();
	expect(downloadPresentation).not.toHaveBeenCalled();
});

it("routes approvals to the existing tool review", async () => {
	workbench.tools = { [tool.id]: { ...tool, status: "INPUT_REQUIRED" } };
	render(<ThreadPresentation />);
	await userEvent.click(
		screen.getByRole("button", { name: "Review request" }),
	);
	expect(workbench.openWorkbench).toHaveBeenCalledExactlyOnceWith(tool.id);
	expect(
		screen.queryByRole("button", { name: /Download/ }),
	).not.toBeInTheDocument();
});

it("does not open another room's files or incomplete workflow output", () => {
	workbench.tools = {
		child: { ...tool, id: "child", roomId: "child-room" },
		unavailable: {
			...tool,
			id: "unavailable",
			output: '{"workflow":"pptx","filePath":"review.pptx","artifact":{"status":"unavailable"}}',
		},
	};
	render(<ThreadPresentation />);
	expect(
		screen.queryByRole("button", { name: /Open / }),
	).not.toBeInTheDocument();
	expect(
		screen.queryByRole("button", { name: /Download/ }),
	).not.toBeInTheDocument();
});

it("keeps download errors visible and allows retry in the originating insight", async () => {
	workbench.tools = { [tool.id]: tool };
	vi.mocked(downloadPresentation).mockRejectedValueOnce(
		new Error("File is unavailable"),
	);
	render(<ThreadPresentation />);
	const button = screen.getByRole("button", { name: "Download review.pptx" });
	await userEvent.click(button);
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"File is unavailable",
	);
	expect(button).toBeEnabled();
	vi.mocked(downloadPresentation).mockResolvedValueOnce(undefined);
	await userEvent.click(button);
	await waitFor(() =>
		expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
	);
	expect(downloadPresentation).toHaveBeenLastCalledWith(
		session.insight.actions,
		"thread-insight",
		"decks/review.pptx",
	);
});

it("disables repeated downloads while a file request is pending", async () => {
	workbench.tools = { [tool.id]: tool };
	let finish: (() => void) | undefined;
	vi.mocked(downloadPresentation).mockImplementation(
		() =>
			new Promise<void>((resolve) => {
				finish = resolve;
			}),
	);
	render(<ThreadPresentation />);
	const button = screen.getByRole("button", { name: "Download review.pptx" });
	await userEvent.click(button);
	expect(button).toBeDisabled();
	expect(button).toHaveTextContent("Downloading…");
	await act(async () => {
		finish?.();
	});
	expect(button).toBeEnabled();
});
