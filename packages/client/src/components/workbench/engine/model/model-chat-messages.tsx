import { MessageSquareIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Muted, ScrollArea, Spinner } from "@semoss/ui/next";
import { submitLlmFeedback } from "@/api/rooms";
import { useModelChat } from "@/hooks";
import { ModelChatMessage } from "./model-chat-message";

/** How close to the bottom still counts as reading the newest message, in pixels. */
const FOLLOW_THRESHOLD = 24;

/**
 * The model chat transcript: a centered, scrolling message column, as wide as
 * the playground's, that follows a streaming turn while the reader is at the
 * bottom. Scrolling up to read stops the follow, scrolling back down resumes
 * it, and a new turn starts it again.
 *
 * @name ModelChatMessages
 * @return The transcript.
 */
export const ModelChatMessages = () => {
	const messages = useModelChat((state) => state.messages);
	const insightId = useModelChat((state) => state.insightId);
	const roomId = useModelChat((state) => state.roomId);
	const isInitializing = useModelChat((state) => state.isInitializing);
	const isSending = useModelChat((state) => state.isSending);
	const isStopping = useModelChat((state) => state.isStopping);
	const send = useModelChat((state) => state.send);

	const [feedback, setFeedback] = useState<
		Record<string, "true" | "false" | null>
	>({});
	const bottomRef = useRef<HTMLDivElement>(null);
	const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
	const isFollowingRef = useRef(true);
	const messageCountRef = useRef(messages.length);

	// Ratings are per conversation: the panel is keepAlive, so without this
	// they would outlive the room they were given in. Another conversation
	// also opens at its newest message, even when it has fewer messages.
	// biome-ignore lint/correctness/useExhaustiveDependencies: roomId is the reset trigger, not a value the effect reads
	useEffect(() => {
		setFeedback({});
		isFollowingRef.current = true;
	}, [roomId]);

	useEffect(() => {
		if (!viewport) return;
		const handleScroll = () => {
			isFollowingRef.current =
				viewport.scrollHeight -
					viewport.scrollTop -
					viewport.clientHeight <=
				FOLLOW_THRESHOLD;
		};
		viewport.addEventListener("scroll", handleScroll, { passive: true });
		return () => viewport.removeEventListener("scroll", handleScroll);
	}, [viewport]);

	// Run on every transcript change, since streaming updates the last message
	// in place: a new message means a new turn or another conversation, which
	// always starts at the bottom; otherwise follow only while the reader is
	// there.
	useEffect(() => {
		if (messages.length > messageCountRef.current) {
			isFollowingRef.current = true;
		}
		messageCountRef.current = messages.length;
		if (isFollowingRef.current) {
			bottomRef.current?.scrollIntoView({ block: "end" });
		}
	}, [messages]);

	/**
	 * Record a rating against the durable message id. Failures are logged
	 * rather than surfaced: the button has already acknowledged the click, and
	 * a lost rating is not worth interrupting the conversation over.
	 */
	const handleFeedback = (messageId: string, rating: "true" | "false") => {
		if (!insightId || !roomId) return;

		setFeedback((current) => ({ ...current, [messageId]: rating }));
		void submitLlmFeedback(insightId, roomId, messageId, rating).catch(
			(error) => {
				console.warn("SubmitLlmFeedback failed:", error);
			},
		);
	};

	/**
	 * Re-ask the prompt that produced a given reply, carrying its attachments
	 * over — they are already uploaded, so the re-ask reuses them rather than
	 * asking the user to attach them again.
	 */
	const handleRewrite = (messageId: string) => {
		const index = messages.findIndex((message) => message.id === messageId);
		const prompt = messages[index - 1];
		if (prompt?.io === "INPUT") {
			void send(prompt.text, prompt.attachments);
		}
	};

	if (isInitializing) {
		return (
			<div className="flex flex-1 items-center justify-center gap-2">
				<Spinner className="size-4" />
				<Muted className="text-sm">Starting a conversation…</Muted>
			</div>
		);
	}

	if (messages.length === 0) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
				<div className="flex size-10 items-center justify-center rounded-lg bg-muted">
					<MessageSquareIcon
						className="size-5 text-muted-foreground"
						aria-hidden
					/>
				</div>
				<Muted className="text-sm">
					Ask a question to start testing this model.
				</Muted>
			</div>
		);
	}

	return (
		<ScrollArea
			viewportRef={setViewport}
			type="always"
			className="[&_[data-slot=scroll-area-viewport]>div]:block! min-h-0 flex-1"
			data-testid="model-chat-messages-scroller"
		>
			<div
				className="mx-auto box-content flex max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6"
				aria-live="polite"
			>
				{messages.map((message) => (
					<ModelChatMessage
						key={message.id}
						message={message}
						feedback={feedback[message.id] ?? null}
						onFeedback={handleFeedback}
						onRewrite={handleRewrite}
						isBusy={isSending || isStopping}
					/>
				))}
				<div ref={bottomRef} />
			</div>
		</ScrollArea>
	);
};
