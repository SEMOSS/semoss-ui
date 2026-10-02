import { act, fireEvent, render, screen } from "@testing-library/react";
import { TooltipProvider } from "@semoss/ui/next";
import { createWorkbenchStore } from "@semoss/workbench";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type { ThreadWorkspace } from "@/features/collaboration/state/collaboration.types";
import type { ConversationTool } from "@/features/messages/types/message";
import { composeEmailPart } from "@/features/thread-assistant/compose-email.test-fixtures";
import { composeDraftId } from "@/features/thread-assistant/thread-draft-proposal";
import { ToolCallCard } from "@/features/tools/components/tool-call-card";
import {
	emailDraftToolPreview,
	isEmailDraftTool,
} from "@/features/tools/utils/email-draft-tool";
import { WorkComposerSession } from "./work-composer-session";
import { WORK_DRAFT_PANEL } from "./work-draft-panel";
import { WorkEmailContext } from "./work-email.context";
import { WORK_EMAIL_PANEL, WorkEmailPanel } from "./work-email-panel";

const selected = vi.hoisted(() => ({
	config: { kind: "source", itemId: "email-1" },
}));
const dock = vi.hoisted(() => ({
	tools: {} as Record<string, ConversationTool>,
	pendingApprovals: [] as { toolId: string }[],
	isToolInline: () => false,
	openInline: vi.fn(),
	openWorkbench: vi.fn(),
	closeTool: vi.fn(),
	activeToolId: null,
	isOpen: false,
}));
vi.mock("@semoss/workbench", async (original) => ({
	...(await original<typeof import("@semoss/workbench")>()),
	useWorkbenchPanel: () => selected,
}));
vi.mock("@/features/collaboration/state/collaboration-session.context", () => ({
	useCollaborationSession: () => ({
		state: { people: [{ id: "sender", name: "Alex Chen" }] },
	}),
}));
vi.mock("@/features/tools/tool-workbench.context", () => ({
	useToolWorkbench: () => dock,
}));
vi.mock("@/features/tools/components/tool-content", () => ({
	ToolContent: () => <button type="button">Review approval</button>,
}));
vi.mock("@semoss/ui/next", async (original) => ({
	...(await original<typeof import("@semoss/ui/next")>()),
	useIsMobile: () => false,
}));

const state = createInitialCollaborationState();
const thread = { ...state.threads[0], subject: "Project update" };
const workspace = {
	...state.workspaces[thread.id],
	messages: [
		{
			id: "email-1",
			fromId: "sender",
			text: "Plain fallback",
			at: "2026-09-29T12:00:00Z",
			to: ["reader@example.com"],
			cc: ["team@example.com"],
			displayBody: {
				contentType: "html" as const,
				content: "<p><strong>Formatted email</strong></p>",
				attachments: [{ name: "brief.pdf" }],
			},
			webLink: "https://outlook.office.com/mail/id/email-1",
		},
	],
};
function draftTool(): ConversationTool {
	return {
		id: "draft-tool",
		parentMessageId: "assistant-message",
		name: "MicrosoftOutlookSaveDraft",
		title: "Save draft",
		status: "COMPLETED",
		arguments: {
			to: ["reader@example.com"],
			subject: "Draft subject",
			message: "<p><strong>Draft content</strong></p>",
			html: true,
		},
		output: JSON.stringify({
			webLink: "https://outlook.office.com/mail/draft-1",
		}),
	};
}
const readerPanelId = "reader";
function view(
	child = <WorkEmailPanel id={readerPanelId} />,
	openEmail = vi.fn(),
	content: ThreadWorkspace = workspace,
) {
	return (
		<TooltipProvider>
			<WorkEmailContext.Provider
				value={{
					thread,
					workspace: content,
					composer: new WorkComposerSession(),
					allowedSources: new Set(),
					openEmail,
				}}
			>
				{child}
			</WorkEmailContext.Provider>
		</TooltipProvider>
	);
}
beforeEach(() => {
	selected.config = { kind: "source", itemId: "email-1" };
	dock.tools = {};
	dock.pendingApprovals = [];
	vi.clearAllMocks();
});

it("renders email metadata, expandable recipients, attachments, and an isolated full body", () => {
	render(view());
	expect(
		screen.getByRole("heading", { name: "Project update" }),
	).toBeVisible();
	expect(screen.getByText("Alex Chen")).toBeVisible();
	expect(screen.getByText("Excluded from assistant context")).toBeVisible();
	fireEvent.click(screen.getByText("Recipients"));
	expect(screen.getAllByText("reader@example.com").at(-1)).toBeVisible();
	expect(screen.getByText(/brief.pdf/)).toBeVisible();
	const frame = screen.getByTitle("Email from Alex Chen");
	expect(frame.getAttribute("srcdoc")).toContain("Formatted email");
	expect(frame.getAttribute("sandbox")).not.toContain("allow-scripts");
	if (!(frame instanceof HTMLIFrameElement) || !frame.contentDocument?.body)
		throw new Error("Expected an email document");
	vi.spyOn(
		frame.contentDocument.body,
		"getBoundingClientRect",
	).mockReturnValue(new DOMRect(0, 0, 400, 1600));
	fireEvent.load(frame);
	expect(frame).toHaveStyle({ height: "1600px" });
	expect(
		screen.queryByRole("button", { name: "Show full email" }),
	).toBeNull();
	expect(
		screen.getByRole("link", { name: "Open in Outlook" }),
	).toHaveAttribute("href", workspace.messages[0].webLink);
});

it("falls back to source text when formatted content is empty and recovers from missing sources", () => {
	const content = {
		...workspace,
		messages: [
			{
				...workspace.messages[0],
				displayBody: {
					contentType: "html" as const,
					content: "<p></p>",
				},
			},
		],
	};
	const { rerender } = render(view(undefined, undefined, content));
	expect(screen.getByText("Plain fallback")).toBeVisible();
	expect(screen.queryByTitle("Email from Alex Chen")).toBeNull();
	selected.config = { kind: "source", itemId: "missing" };
	rerender(view());
	expect(
		screen.getByText("This email is no longer available in the thread."),
	).toBeVisible();
});

it("opens compact saved-draft cards in Work and keeps their full body out of chat", () => {
	const tool = draftTool();
	dock.tools = { [tool.id]: tool };
	const openEmail = vi.fn();
	render(view(<ToolCallCard tool={tool} />, openEmail));
	expect(screen.getByText("Saved to Outlook")).toBeVisible();
	expect(screen.queryByText("Draft content")).toBeNull();
	const card = screen.getByRole("button", {
		name: "Open email draft: Draft subject",
	});
	fireEvent.click(card);
	expect(openEmail).toHaveBeenCalledWith(tool.id, "tool", card);
	expect(dock.openInline).not.toHaveBeenCalled();
});

it("shows formatted saved-draft previews, failed states, and existing approval controls", () => {
	const tool = draftTool();
	dock.tools = { [tool.id]: tool };
	selected.config = { kind: "tool", itemId: tool.id };
	const { rerender } = render(view());
	expect(screen.getByTitle("Draft subject").getAttribute("srcdoc")).toContain(
		"Draft content",
	);
	expect(
		screen.getByRole("link", { name: "Open draft in Outlook" }),
	).toBeVisible();
	dock.tools = {
		[tool.id]: { ...tool, status: "FAILED", error: "Save rejected" },
	};
	rerender(view());
	expect(screen.getByRole("alert")).toHaveTextContent("Save rejected");
	expect(
		screen.queryByRole("link", { name: "Open draft in Outlook" }),
	).toBeNull();
	dock.pendingApprovals = [{ toolId: tool.id }];
	rerender(view());
	expect(
		screen.getByRole("button", { name: "Review approval" }),
	).toBeVisible();
});

it("reuses tabs by stable source and draft identity without conflating a source and a tool", () => {
	const store = createWorkbenchStore({
		components: { email: WORK_EMAIL_PANEL, draft: WORK_DRAFT_PANEL },
	});
	const actions = store.getState().layout.actions;
	actions.loadSnapshot({
		tree: {
			type: "tabset",
			id: "main",
			size: 1,
			panelIds: [],
			activeId: null,
		},
		panels: {},
	});
	const first = actions.selectPanel("email", {
		kind: "source",
		itemId: "same-id",
	});
	expect(
		actions.selectPanel("email", { kind: "source", itemId: "same-id" }),
	).toBe(first);
	expect(
		actions.selectPanel("email", { kind: "tool", itemId: "same-id" }),
	).not.toBe(first);
	const draft = actions.selectPanel("draft", { draftId: "reply:source" });
	expect(actions.selectPanel("draft", { draftId: "reply:source" })).toBe(
		draft,
	);
	expect(Object.keys(store.getState().layout.panels)).toHaveLength(3);
});

it("recognizes only draft operations and handles incomplete metadata and output", () => {
	const tool = draftTool();
	expect(
		isEmailDraftTool({
			...tool,
			name: "MicrosoftOutlookReplyMail",
			arguments: { asDraft: true, comment: "Reply" },
		}),
	).toBe(true);
	expect(
		isEmailDraftTool({
			...tool,
			name: "MicrosoftOutlookReplyMail",
			arguments: { asDraft: false },
		}),
	).toBe(false);
	expect(
		emailDraftToolPreview({ ...tool, arguments: {}, output: "partial" }),
	).toMatchObject({ subject: "", body: "", webLink: undefined });
});

it("names a reply card by what its editor holds, not the model's guess", () => {
	const part = composeEmailPart(
		{ replyTo: "email-1", to: "elise.hynd@example.com", message: "Thanks" },
		"reply-call",
	);
	if (part.type !== "tool") throw new Error("expected a tool part");
	const composer = new WorkComposerSession();
	const draft = composer.requestEmailDraft({
		id: composeDraftId("reply-call"),
		mode: "reply",
		sourceUid: "email-1",
		subject: "Cert challenge",
		to: "ehynd@example.com",
		body: "Thanks",
	});
	render(
		<TooltipProvider>
			<WorkEmailContext.Provider
				value={{
					thread,
					workspace,
					composer,
					allowedSources: new Set(),
					openEmail: vi.fn(),
				}}
			>
				<ToolCallCard tool={part.tool} />
			</WorkEmailContext.Provider>
		</TooltipProvider>,
	);
	expect(screen.getByText("Reply · Cert challenge")).toBeVisible();
	expect(screen.getByText("To ehynd@example.com")).toBeVisible();
	expect(screen.queryByText(/elise\.hynd/)).toBeNull();
	act(() =>
		draft.setValues({
			...draft.getSnapshot().values,
			to: "ehynd@example.com, me@example.com",
		}),
	);
	expect(
		screen.getByText("To ehynd@example.com, me@example.com"),
	).toBeVisible();
});
