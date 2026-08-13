import { Bot, Loader2, RotateCcw, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { runPixel } from "@semoss/sdk";
import { Button, Textarea } from "@semoss/ui/next";
import type { AutomationDocument } from "../../domain/automation.types";

export interface ChatMessage {
	/** Stable ID for React key — assigned at push time */
	id: number;
	role: "user" | "assistant";
	content: string;
}

export interface ChatPanelProps {
	/** The project/app ID this automation belongs to */
	appId: string;
	/** Whether the panel is visible */
	open: boolean;
	/** Called when the user closes the panel */
	onClose?: () => void;
	/** Called when the agent has produced a build signal and the user confirms */
	onGenerated: (doc: AutomationDocument, description: string) => void;
	/** Pre-fills the input textarea when the panel opens (e.g. from AI Fix) */
	prefilledInput?: string;
	/** Number of non-trigger steps in the current automation — changes CTA label to "Update" */
	stepsCount?: number;
	/** Base64-encoded current automation document — passed to BuildAutomation for edit mode */
	currentDocBase64?: string;
	/** When true the panel expands to fill the full viewport width (used for the template gallery "Build with AI" flow) */
	fullscreen?: boolean;
}

const BUILD_SIGNAL_REGEX =
	/\{"action"\s*:\s*"build"\s*,\s*"description"\s*:\s*"([^"]+)"\}/;

/** Rotating status messages shown while BuildAutomation runs. */
const BUILD_STEPS = [
	"Analyzing your request…",
	"Designing steps…",
	"Finalizing automation…",
];

/** Encodes a value to base64 safely (handles Unicode). */
function toBase64(str: string): string {
	return btoa(
		encodeURIComponent(str).replace(/%([0-9A-F]{2})/gi, (_, p1) =>
			String.fromCharCode(parseInt(p1, 16)),
		),
	);
}

/** Parses the build signal from an assistant message, if present. */
function parseBuildSignal(content: string): string | null {
	const match = content.match(BUILD_SIGNAL_REGEX);
	return match ? match[1] : null;
}

/**
 * Renders assistant message text, stripping the raw build-signal JSON from display.
 * If a build description is present, renders the "Build automation" CTA below the text.
 */
function AssistantBubble({
	content,
	buildDescription,
	stepsCount,
	onBuild,
}: {
	content: string;
	buildDescription: string | null;
	stepsCount: number;
	onBuild: () => void;
}) {
	const display = content.replace(BUILD_SIGNAL_REGEX, "").trim();
	return (
		<div className="flex flex-col gap-3">
			<p className="whitespace-pre-wrap text-sm leading-relaxed">
				{display}
			</p>
			{buildDescription && (
				<Button size="sm" className="self-start" onClick={onBuild}>
					<Sparkles className="mr-1.5 h-3.5 w-3.5" />
					{stepsCount > 0 ? "Update automation" : "Build automation"}
				</Button>
			)}
		</div>
	);
}

/**
 * Flex-sibling chat panel for conversational automation building.
 * Uses AutomationAskRoom for server-side history via SEMOSS Room.
 * Room IDs are short alphanumeric strings to avoid DB column length issues.
 */
export function ChatPanel({
	appId,
	open,
	onClose,
	onGenerated,
	prefilledInput,
	stepsCount = 0,
	currentDocBase64,
	fullscreen = false,
}: ChatPanelProps) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [sending, setSending] = useState(false);
	const [building, setBuilding] = useState(false);
	const [buildStepIdx, setBuildStepIdx] = useState(0);
	const [error, setError] = useState<string | null>(null);
	/** Incrementing this suffix creates a fresh Room, effectively clearing server-side history. */
	const [roomSuffix, setRoomSuffix] = useState(0);

	const scrollRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	/** Tracks the last prefilledInput value that was auto-sent to prevent duplicate sends. */
	const autoSentRef = useRef<string | undefined>(undefined);

	// Short alphanumeric room ID — avoids UUID hyphens that can exceed DB column limits.
	// 8-char appId prefix gives sufficient project-level uniqueness.
	const appPrefix = appId.replace(/-/g, "").slice(0, 8);
	const roomId = `automationchat${appPrefix}${roomSuffix}`;

	// Auto-scroll to bottom on new messages or thinking state
	useEffect(() => {
		const el = scrollRef.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [messages, sending, building]);

	// When a prefilledInput arrives (e.g. from AI Fix), auto-send it without user action
	useEffect(() => {
		if (
			!open ||
			!prefilledInput ||
			autoSentRef.current === prefilledInput ||
			sending
		)
			return;
		autoSentRef.current = prefilledInput;

		const text = prefilledInput.trim();
		if (!text) return;

		const userMsg: ChatMessage = {
			id: Date.now(),
			role: "user",
			content: text,
		};
		setMessages((prev) => [...prev, userMsg]);
		setSending(true);
		setError(null);

		const encodedCommand = toBase64(text);
		void runPixel(
			`AutomationAskRoom(project=["${appId}"], room=["${roomId}"], command=["${encodedCommand}"]);`,
		)
			.then((result) => {
				const reply = result.pixelReturn?.[0]?.output;
				if (typeof reply !== "string" || !reply.trim()) {
					throw new Error("No response from AI. Try again.");
				}
				setMessages((prev) => [
					...prev,
					{
						id: Date.now() + 1,
						role: "assistant" as const,
						content: reply.trim(),
					},
				]);
			})
			.catch((e: unknown) => {
				setError(
					e instanceof Error
						? e.message
						: "Something went wrong. Try again.",
				);
			})
			.finally(() => setSending(false));
	}, [open, prefilledInput, appId, roomId, sending]);

	// Focus input when panel opens without a prefilledInput (normal open)
	useEffect(() => {
		if (!open || prefilledInput) return;
		const id = setTimeout(() => inputRef.current?.focus(), 100);
		return () => clearTimeout(id);
	}, [open, prefilledInput]);

	// Cycle build-step messages while building
	useEffect(() => {
		if (!building) return;
		const interval = setInterval(() => {
			setBuildStepIdx((i) => (i + 1) % BUILD_STEPS.length);
		}, 3000);
		return () => clearInterval(interval);
	}, [building]);

	// The last assistant message (if any) may contain a build signal
	const lastAssistant = [...messages]
		.reverse()
		.find((m) => m.role === "assistant");
	const pendingBuildDescription = lastAssistant
		? parseBuildSignal(lastAssistant.content)
		: null;

	/** Sends the current input as a user message and fetches the next assistant response. */
	const sendMessage = async () => {
		const text = input.trim();
		if (!text || sending) return;

		const userMsg: ChatMessage = {
			id: Date.now(),
			role: "user",
			content: text,
		};
		setMessages((prev) => [...prev, userMsg]);
		setInput("");
		setSending(true);
		setError(null);

		try {
			const encodedCommand = toBase64(text);
			const result = await runPixel(
				`AutomationAskRoom(project=["${appId}"], room=["${roomId}"], command=["${encodedCommand}"]);`,
			);
			const reply = result.pixelReturn?.[0]?.output;
			if (typeof reply !== "string" || !reply.trim()) {
				throw new Error("No response from AI. Try again.");
			}
			setMessages((prev) => [
				...prev,
				{
					id: Date.now() + 1,
					role: "assistant" as const,
					content: reply.trim(),
				},
			]);
		} catch (e) {
			setError(
				e instanceof Error
					? e.message
					: "Something went wrong. Try again.",
			);
		} finally {
			setSending(false);
		}
	};

	/**
	 * Calls BuildAutomation with the pending description, validates the returned document,
	 * then forwards it to the parent via onGenerated.
	 */
	const buildNow = async () => {
		if (!pendingBuildDescription || building) return;
		setBuilding(true);
		setBuildStepIdx(0);
		setError(null);
		try {
			const encodedDesc = toBase64(pendingBuildDescription);
			const currentDocParam = currentDocBase64
				? `, currentDoc=["${currentDocBase64}"]`
				: "";
			const result = await runPixel(
				`BuildAutomation(project=["${appId}"], description=["${encodedDesc}"]${currentDocParam});`,
			);
			const raw = result.pixelReturn?.[0]?.output;
			if (typeof raw !== "string" || !raw) {
				throw new Error("No response from AI.");
			}
			let doc: AutomationDocument;
			try {
				doc = JSON.parse(raw) as AutomationDocument;
			} catch {
				throw new Error(
					"AI returned an unreadable response — please try again.",
				);
			}
			if (!Array.isArray(doc?.graph?.nodes)) {
				throw new Error(
					"AI returned an unexpected structure — please try again.",
				);
			}
			onGenerated(doc, pendingBuildDescription);
		} catch (e) {
			setError(
				`Build failed: ${e instanceof Error ? e.message : "Unknown error"}`,
			);
		} finally {
			setBuilding(false);
		}
	};

	const clearHistory = () => {
		setMessages([]);
		setError(null);
		setInput("");
		setRoomSuffix((s) => s + 1);
	};

	if (!open) return null;

	return (
		<div
			className={`flex h-full shrink-0 flex-col border-l bg-background ${fullscreen ? "flex-1" : "w-[400px]"}`}
		>
			{/* Header */}
			<div className="flex items-center justify-between border-b px-4 py-3">
				<div className="flex items-center gap-2">
					<Sparkles className="h-4 w-4 text-primary" />
					<span className="font-semibold text-sm">Build with AI</span>
				</div>
				<div className="flex items-center gap-1">
					{messages.length > 0 && (
						<button
							type="button"
							onClick={clearHistory}
							className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
							title="Start a new conversation"
						>
							<RotateCcw className="h-3 w-3" />
							New chat
						</button>
					)}
					{onClose && (
						<button
							type="button"
							onClick={onClose}
							className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
							aria-label="Close chat panel"
						>
							<X className="h-4 w-4" />
						</button>
					)}
				</div>
			</div>

			{/* Message list */}
			<div ref={scrollRef} className="flex-1 overflow-y-auto">
				{messages.length === 0 ? (
					<div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
						<Bot className="h-8 w-8 text-muted-foreground/30" />
						<p className="max-w-[260px] text-muted-foreground text-sm leading-relaxed">
							Describe what your automation should do and
							I&apos;ll help you build it.
						</p>
					</div>
				) : (
					<div className="flex flex-col gap-3 p-4">
						{messages.map((msg) => {
							const isLastWithBuild =
								msg === lastAssistant &&
								pendingBuildDescription !== null;
							if (msg.role === "user") {
								return (
									<div
										key={msg.id}
										className="flex justify-end"
									>
										<div className="max-w-[80%] rounded-lg bg-accent px-4 py-3">
											<p className="whitespace-pre-wrap text-sm leading-relaxed">
												{msg.content}
											</p>
										</div>
									</div>
								);
							}
							return (
								<div key={msg.id} className="max-w-[85%]">
									<AssistantBubble
										content={msg.content}
										buildDescription={
											isLastWithBuild
												? pendingBuildDescription
												: null
										}
										stepsCount={stepsCount}
										onBuild={() => void buildNow()}
									/>
								</div>
							);
						})}

						{/* Thinking indicator */}
						{sending && (
							<div className="flex items-center gap-2 text-muted-foreground text-sm">
								<Loader2 className="h-3.5 w-3.5 animate-spin" />
								Thinking…
							</div>
						)}

						{/* Building indicator */}
						{building && (
							<div className="flex items-center gap-2 text-primary text-sm">
								<Loader2 className="h-3.5 w-3.5 animate-spin" />
								{BUILD_STEPS[buildStepIdx]}
							</div>
						)}
					</div>
				)}
			</div>

			{/* Error */}
			{error && (
				<div className="border-t bg-destructive/5 px-4 py-2 text-destructive text-xs">
					{error}
				</div>
			)}

			{/* Input area */}
			<div className="border-t px-4 py-3">
				<div className="flex gap-2">
					<Textarea
						ref={inputRef}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Describe what you'd like to automate…"
						className="max-h-[120px] min-h-[60px] flex-1 resize-none overflow-y-auto text-sm"
						onKeyDown={(e) => {
							if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
								void sendMessage();
							}
						}}
					/>
					<button
						type="button"
						disabled={!input.trim() || sending || building}
						onClick={() => void sendMessage()}
						className="self-end rounded-lg bg-primary p-2 text-primary-foreground transition-opacity disabled:opacity-50"
						aria-label="Send"
					>
						<Send className="h-4 w-4" />
					</button>
				</div>
				<p className="mt-1.5 text-[10px] text-muted-foreground">
					Press Cmd+Enter to send
				</p>
			</div>
		</div>
	);
}
