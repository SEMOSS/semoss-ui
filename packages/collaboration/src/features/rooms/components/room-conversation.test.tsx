import { fireEvent, render, screen } from "@testing-library/react";
import { type ComponentProps, useState } from "react";
import { CollaborationHeaderContext } from "@/features/collaboration/components/collaboration-header.context";
import { RoomConversation } from "./room-conversation";

const props: ComponentProps<typeof RoomConversation> = {
	agent: {
		name: "Research agent",
		description: "",
		system_prompt: "",
		mcp: [],
		skills: [],
		prompts: [],
	},
	title: "Research conversation",
	conversationId: "room-one",
	thread: [
		{
			id: "one",
			role: "user",
			parts: [{ type: "text", text: "Find the report" }],
		},
	],
	isLoadingHistory: false,
	phase: null,
	hasObservationIssue: false,
	resumeSignal: 0,
	isToolWorkbenchOpen: false,
	onToggleToolWorkbench: vi.fn(),
	status: null,
	composer: <textarea aria-label="Message draft" />,
};

/** A real shell target with a mounted conversation underneath it. */
function ShellFixture({
	isHidden = false,
	isLanding = false,
}: {
	isHidden?: boolean;
	isLanding?: boolean;
}) {
	const [target, setTarget] = useState<HTMLDivElement | null>(null);
	return (
		<CollaborationHeaderContext.Provider value={target}>
			<header>
				<div ref={setTarget} />
			</header>
			<RoomConversation
				{...props}
				isHidden={isHidden}
				isLanding={isLanding}
			/>
		</CollaborationHeaderContext.Provider>
	);
}

it("renders the room transcript and workbench action without agent configuration", () => {
	render(<RoomConversation {...props} />);
	expect(screen.getByText("Find the report")).toBeVisible();
	expect(screen.getByText(props.title)).toBeVisible();
	expect(
		screen.queryByRole("button", { name: /Configure|Agent settings/ }),
	).not.toBeInTheDocument();
	fireEvent.click(screen.getByRole("button", { name: "Open workbench" }));
	expect(props.onToggleToolWorkbench).toHaveBeenCalledOnce();
});

it("preserves the editor when a new session becomes a saved room", () => {
	const { rerender } = render(<RoomConversation {...props} isLanding />);
	const editor = screen.getByRole("textbox", { name: "Message draft" });
	fireEvent.change(editor, { target: { value: "Keep my draft" } });
	expect(
		screen.queryByRole("region", { name: "Conversation messages" }),
	).not.toBeInTheDocument();
	rerender(<RoomConversation {...props} />);
	expect(screen.getByRole("textbox", { name: "Message draft" })).toBe(editor);
	expect(editor).toHaveValue("Keep my draft");
	expect(
		screen.getByRole("region", { name: "Conversation messages" }),
	).toBeVisible();
});

it("keeps room controls in the shell while the workbench hides the mounted editor", () => {
	const { rerender } = render(<ShellFixture isLanding />);
	expect(
		screen.queryByRole("button", { name: /Conversation details/ }),
	).not.toBeInTheDocument();
	const editor = screen.getByRole("textbox", { name: "Message draft" });
	fireEvent.change(editor, { target: { value: "Keep my workbench draft" } });
	rerender(<ShellFixture />);
	const title = screen.getByRole("button", { name: /Conversation details/ });
	expect(screen.getByRole("banner")).toContainElement(title);
	expect(document.querySelectorAll("header")).toHaveLength(1);
	rerender(<ShellFixture isHidden />);
	expect(title).toBeVisible();
	expect(
		screen.getByRole("button", { name: "Open workbench" }),
	).toBeVisible();
	expect(editor).not.toBeVisible();
	rerender(<ShellFixture />);
	expect(screen.getByRole("textbox", { name: "Message draft" })).toBe(editor);
	expect(editor).toHaveValue("Keep my workbench draft");
	expect(screen.getByRole("button", { name: /Conversation details/ })).toBe(
		title,
	);
});
