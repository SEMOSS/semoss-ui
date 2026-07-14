import { type ReactNode, useState } from "react";
import { Button } from "@semoss/ui/next";
import {
	ChatInput,
	MessageBubble,
	MessageList,
	PromptLibraryDialog,
	type PromptLibraryItem,
	ToolCallView,
	TypingIndicator,
} from "../src/components";
import type { ChatMessage } from "../src/types";

const SAMPLE_PROMPTS: PromptLibraryItem[] = [
	{
		id: "p1",
		title: "Summarize a claim",
		context: "Summarize the status and next steps for a given claim id.",
		tags: ["claims"],
	},
	{
		id: "p2",
		title: "Draft a benefits letter",
		context: "Draft a benefits eligibility letter for a member.",
		tags: ["benefits", "letters"],
	},
	{
		id: "p3",
		title: "Explain a denial",
		context: "Explain why a claim was denied in plain language.",
		tags: ["claims"],
	},
	{
		id: "p4",
		title: "General greeting",
		context: "Say hello and ask how you can help today.",
	},
];

const SAMPLE_MESSAGES: ChatMessage[] = [
	{
		id: "1",
		role: "user",
		parts: [
			{
				type: "text",
				id: "p1",
				text: "What's the status of claim #482?",
			},
		],
		status: "complete",
		timestamp: new Date(),
	},
	{
		id: "2",
		role: "assistant",
		parts: [
			{
				type: "text",
				id: "p2",
				text: "Claim **#482** is currently in review. Estimated completion: 3 business days.",
			},
		],
		status: "complete",
		timestamp: new Date(),
	},
	{
		id: "3",
		role: "assistant",
		parts: [
			{
				type: "text",
				id: "p3",
				text: "Something went wrong reaching the model.",
			},
		],
		status: "error",
		timestamp: new Date(),
	},
];

const MARKDOWN_RICH_MESSAGE: ChatMessage = {
	id: "5",
	role: "assistant",
	parts: [
		{
			type: "text",
			id: "p5",
			text: [
				"Here's what I found, with a code sample and the raw data:",
				"",
				"```python",
				"def lookup_claim(claim_id):",
				"    return db.query(claim_id)",
				"```",
				"",
				"| Claim | Status | Days Left |",
				"| --- | --- | --- |",
				"| #482 | In review | 3 |",
				"| #501 | Approved | 0 |",
				"",
				"> source: internal claims database",
			].join("\n"),
		},
	],
	status: "complete",
	timestamp: new Date(),
};

const MERMAID_MESSAGE: ChatMessage = {
	id: "6",
	role: "assistant",
	parts: [
		{
			type: "text",
			id: "p6",
			text: [
				"Here's how claim review routes:",
				"",
				"```mermaid",
				"graph TD;",
				"  Submitted --> Review;",
				"  Review --> Approved;",
				"  Review --> Denied;",
				"```",
			].join("\n"),
		},
	],
	status: "complete",
	timestamp: new Date(),
};

const HTML_PREVIEW_MESSAGE: ChatMessage = {
	id: "7",
	role: "assistant",
	parts: [
		{
			type: "text",
			id: "p7",
			text: [
				"Here's a small preview card:",
				"",
				"```html",
				"<!DOCTYPE html>",
				"<html>",
				'<body style="font-family: sans-serif; padding: 1rem;">',
				"  <h2>Claim #482</h2>",
				"  <p>Status: <strong>In review</strong></p>",
				"</body>",
				"</html>",
				"```",
			].join("\n"),
		},
	],
	status: "complete",
	timestamp: new Date(),
};

const TOOL_CALL_MESSAGE: ChatMessage = {
	id: "4",
	role: "assistant",
	parts: [
		{
			type: "tool_call",
			id: "tool-1",
			name: "lookupClaimStatus",
			arguments: {},
		},
	],
	status: "streaming",
	timestamp: new Date(),
};

const FEEDBACK_DEMO_MESSAGE: ChatMessage = {
	id: "8",
	role: "assistant",
	parts: [
		{
			type: "text",
			id: "p8",
			text: "Claim **#482** is currently in review. Estimated completion: 3 business days.",
		},
	],
	status: "complete",
	timestamp: new Date(),
};

function Section({
	title,
	description,
	children,
}: {
	title: string;
	description?: ReactNode;
	children: ReactNode;
}) {
	return (
		<section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
			<div>
				<h2 className="font-semibold text-foreground text-lg">
					{title}
				</h2>
				{description ? (
					<p className="text-muted-foreground text-sm">
						{description}
					</p>
				) : null}
			</div>
			{children}
		</section>
	);
}

export function App() {
	const [isTyping, setIsTyping] = useState(false);
	const [showToolCallMessage, setShowToolCallMessage] = useState(false);
	const [sentMessages, setSentMessages] = useState<
		{ id: string; text: string }[]
	>([]);
	const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
	const [selectedPrompt, setSelectedPrompt] =
		useState<PromptLibraryItem | null>(null);
	const [feedbackDemoMessage, setFeedbackDemoMessage] = useState<ChatMessage>(
		FEEDBACK_DEMO_MESSAGE,
	);

	const messageListMessages = showToolCallMessage
		? [...SAMPLE_MESSAGES, TOOL_CALL_MESSAGE]
		: SAMPLE_MESSAGES;

	return (
		<div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 bg-background p-8">
			<header>
				<h1 className="font-bold text-2xl text-foreground">
					@semoss/chat sandbox
				</h1>
				<p className="text-muted-foreground text-sm">
					Local-only preview — no backend, no{" "}
					<code>InsightProvider</code>. Run <code>pnpm sandbox</code>{" "}
					from <code>libs/chat</code> to view this.{" "}
					<code>ChatPanel</code> isn't shown here since it calls{" "}
					<code>useChat()</code> internally, which requires a real
					backend connection — see the composed pieces below instead.
					These components are built directly on{" "}
					<code>@semoss/ui</code>'s tokens/components to match
					playground's real look — see{" "}
					<code>docs/chat-components/PLAN.md</code> for why this
					sandbox exists instead of Storybook.
				</p>
			</header>

			<Section
				title="MessageBubble"
				description="user = bubble (bg-accent); assistant = no bubble, flush against the page, matching playground. Messages are a sequence of typed parts now, not flat text."
			>
				<div className="flex flex-col gap-2">
					<MessageBubble message={SAMPLE_MESSAGES[0]} />
					<MessageBubble message={SAMPLE_MESSAGES[1]} />
					<MessageBubble message={SAMPLE_MESSAGES[2]} />
					<MessageBubble message={TOOL_CALL_MESSAGE} />
				</div>
			</Section>

			<Section
				title="Markdown rendering"
				description="MessageBubble now renders through @semoss/ui/next's own Markdown (rehypeRaw + Shiki-highlighted code, matching playground's real create-markdown-components.tsx) instead of bare react-markdown — a copyable/labeled code block, a collapsible/exportable table, and source:-prefixed citation styling."
			>
				<MessageBubble message={MARKDOWN_RICH_MESSAGE} />
			</Section>

			<Section
				title="MermaidBlock"
				description="a ```mermaid fence renders as a diagram (lazy-loaded mermaid), with Raw/Diagram toggle, Full View, and Copy — matching playground's own Mermaid block."
			>
				<MessageBubble message={MERMAID_MESSAGE} />
			</Section>

			<Section
				title="HtmlPreviewBlock"
				description="a ```html fence renders as a live Sandpack preview, with Raw/Preview toggle, Full View, and Copy — matching playground's own HTML preview block."
			>
				<MessageBubble message={HTML_PREVIEW_MESSAGE} />
			</Section>

			<Section
				title="MessageList"
				description="composes MessageBubble + a generic TypingIndicator for the gap before any content arrives. Tool calls render inline (with a real running/success/error state) via each message's parts now — there's no separate floating tool indicator."
			>
				<div className="flex gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => setIsTyping((value) => !value)}
					>
						{isTyping ? "Stop typing" : "Start typing"}
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() =>
							setShowToolCallMessage((value) => !value)
						}
					>
						{showToolCallMessage
							? "Hide tool call message"
							: "Show tool call message"}
					</Button>
				</div>
				<div className="h-56 rounded-md border border-border">
					<MessageList
						messages={messageListMessages}
						isTyping={isTyping}
						className="h-full p-3"
					/>
				</div>
			</Section>

			<Section
				title="TypingIndicator / ToolCallView"
				description="standalone — ToolCallView's running/success/error states; click one to expand Parameters (always) and Result (once resolved)"
			>
				<div className="flex flex-col gap-2">
					<TypingIndicator />
					<ToolCallView
						toolName="lookupClaimStatus"
						status="running"
						arguments={{ claimId: "482" }}
					/>
					<ToolCallView
						toolName="lookupClaimStatus"
						status="success"
						arguments={{ claimId: "482" }}
						output='{"status":"in review","daysLeft":3}'
					/>
					<ToolCallView
						toolName="lookupClaimStatus"
						status="error"
						arguments={{ claimId: "482" }}
						output="Claim not found"
					/>
				</div>
			</Section>

			<Section
				title="MessageFeedbackToolbar"
				description="thumbs up/down (click the active one again to clear it), copy, and download (opens a Word/PDF picker) — rendered by MessageBubble via onRate/onDownload, only for a completed assistant message. onDownload is optional here to simulate a real host's async pixel call/failure; omit it entirely to hide the Download action, as MessageBubble does when a host isn't wired up to ChatSession.downloadMessage yet."
			>
				<MessageBubble
					message={feedbackDemoMessage}
					onRate={(rating) =>
						setFeedbackDemoMessage((prev) => ({
							...prev,
							feedback:
								prev.feedback?.rating === rating
									? undefined
									: { rating },
						}))
					}
					onDownload={() =>
						new Promise((resolve) => {
							setTimeout(resolve, 800);
						})
					}
				/>
			</Section>

			<Section
				title="PromptLibraryDialog"
				description="pure-props, like RoomSidebar/EngineSelect — the host app fetches its own prompts and passes them in; searchable/tag-filterable, grouped by tag (a multi-tag prompt appears once per tag group, matching playground)."
			>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setIsPromptLibraryOpen(true)}
				>
					Open prompt library
				</Button>
				{selectedPrompt ? (
					<p className="text-muted-foreground text-sm">
						→ selected: {selectedPrompt.title}
					</p>
				) : null}
				<PromptLibraryDialog
					open={isPromptLibraryOpen}
					onOpenChange={setIsPromptLibraryOpen}
					prompts={SAMPLE_PROMPTS}
					onSelectPrompt={setSelectedPrompt}
				/>
			</Section>

			<Section
				title="ChatInput"
				description="Enter sends, Shift+Enter newlines — logs below instead of calling a real backend. isGenerating swaps Send for a Spinner, matching playground's real thinking state (not a stop/cancel — @semoss/chat has no in-flight-stream cancellation yet). enableVoiceInput adds a mic button (Web Speech API — try it, needs mic permission; PromptOptimizer isn't shown here since it calls useInsight() internally, same reason ChatPanel isn't — see chat-playground instead)."
			>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setIsTyping((value) => !value)}
				>
					{isTyping ? "Stop typing" : "Start typing"}
				</Button>
				<ChatInput
					onSend={(text) =>
						setSentMessages((prev) => [
							...prev,
							{ id: crypto.randomUUID(), text },
						])
					}
					disabled={isTyping}
					isGenerating={isTyping}
					enableVoiceInput
				/>
				{sentMessages.length > 0 ? (
					<ul className="flex flex-col gap-1 text-muted-foreground text-sm">
						{sentMessages.map((message) => (
							<li key={message.id}>→ {message.text}</li>
						))}
					</ul>
				) : null}
			</Section>

			<Section
				title="McpMenuButton / McpOverlay"
				description={
					<>
						Not shown live here — <code>McpOverlay</code> renders
						`@semoss/shared`'s real <code>MCPSelector</code> per
						tab, which calls <code>usePixel</code>/
						<code>useIteratorPixel</code> itself and needs a real{" "}
						<code>InsightProvider</code>, same reason{" "}
						<code>PromptOptimizer</code>/<code>ChatPanel</code>{" "}
						aren't shown here. <code>McpOverlay</code>'s own
						Dialog/Tabs/Save-Cancel shell (and{" "}
						<code>McpMenuButton</code>'s dropdown + count badges)
						are plain props-driven React with no backend dependency
						— only the picker's contents need one. Verified instead
						in <code>chat-playground</code> against the real
						backend: attach a knowledge source and a toolbox tool to
						a real room, confirm <code>UpdateRoomOptions</code>{" "}
						fires with the right <code>mcp</code> array, confirm a
						resumed room restores them.
					</>
				}
			>
				<p className="text-muted-foreground text-sm">
					See <code>packages/chat-playground</code> for the live
					composed version (in <code>ChatInput</code>'s{" "}
					<code>trailingActions</code>).
				</p>
			</Section>

			<Section
				title="What's missing vs. playground"
				description="remaining backlog batches — see docs/chat-components/PLAN.md's Phase 6 master backlog for the full list and reasoning"
			>
				<ul className="list-disc pl-5 text-muted-foreground text-sm">
					<li>
						Compaction indicator/action, context-window pie
						indicator — both need real per-message token accounting
						and/or a message-tree rewrite verified against live data
						first (see PLAN.md's Open Items)
					</li>
					<li>
						File/media attach + preview grid — deferred, needs
						transport-level upload wiring first (no pixel call
						exists yet to attach a file to a message)
					</li>
					<li>
						Room settings/configuration dialog — deferred, still
						needs an Agent/Workspace tab beyond Batch 9's
						Knowledge/Toolbox-only MCP scope
					</li>
					<li>
						MCP overlay's Agent tab + knowledge-creation sub-flow
						(Batch 9 shipped Knowledge/Toolbox attachment of
						existing sources only — see McpMenuButton/McpOverlay
						section above)
					</li>
					<li>
						Message branching/editing (regenerate a response,
						edit-and-resend)
					</li>
					<li>
						Code-block <strong>Execute</strong> button (py/r/pixel)
						— deferred, needs real room/pixel execution wiring
					</li>
					<li>
						Onboarding tour, workspace/knowledge app-shell pages —
						explicitly out of scope (playground's own concern, not a
						chat-library job)
					</li>
					<li>
						Rich-text editing (Lexical) — <code>ChatInput</code> is
						a plain textarea, visually matched but not functionally
						equivalent; slash commands are Lexical-only and stay out
						of scope
					</li>
				</ul>
			</Section>
		</div>
	);
}
