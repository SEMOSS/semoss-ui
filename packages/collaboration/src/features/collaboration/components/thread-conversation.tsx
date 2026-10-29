import { MessageSquarePlus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { Alert, AlertDescription, Button, P, Small } from "@semoss/ui/next";
import { useAddToCurrentChat } from "@/features/rooms/current-chat";
import { readThreadMessagesPage } from "../live/live-state";
import type { Thread, WorkspaceMessage } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { Section } from "./section";
import { ThreadMessage } from "./thread-message";

// enough to tell what the thread is without pushing its settings off the page
const PREVIEW_COUNT = 5;

interface ConversationPage {
	messages: WorkspaceMessage[];
	isLoading: boolean;
	error: string;
	nextCursor?: string;
	unavailableCount: number;
}

const EMPTY: ConversationPage = {
	messages: [],
	isLoading: false,
	error: "",
	unavailableCount: 0,
};

/** The thread's messages, read-only, so the owner can see what a thread is before filing it. */
export function ThreadConversation({ thread }: { thread: Thread }) {
	const { state } = useCollaborationSession();
	// sample, connected, and session threads have no Brain history to read
	const isLive =
		!thread.isSample &&
		!thread.id.startsWith("connected:") &&
		!thread.id.startsWith("session:");
	return isLive ? (
		<LiveThreadConversation key={thread.id} thread={thread} />
	) : (
		<ConversationView
			thread={thread}
			page={{
				...EMPTY,
				messages: state.workspaces[thread.id]?.messages ?? [],
			}}
		/>
	);
}

/** Read the thread through the Brain, so its never rules and exclusions apply. */
function LiveThreadConversation({ thread }: { thread: Thread }) {
	const { actions } = useInsight();
	const [page, setPage] = useState<ConversationPage>({
		...EMPTY,
		isLoading: true,
	});
	// a read the page has since replaced or left must not land
	const request = useRef<symbol | null>(null);
	const read = useCallback(
		(cursor?: string) => {
			const token = Symbol(thread.id);
			request.current = token;
			setPage((current) => ({ ...current, isLoading: true, error: "" }));
			readThreadMessagesPage(actions, thread.id, cursor)
				.then((next) => {
					if (request.current !== token) return;
					setPage((current) => {
						const byId = new Map(
							(cursor ? current.messages : []).map((message) => [
								message.id,
								message,
							]),
						);
						for (const message of next.messages)
							byId.set(message.id, message);
						return {
							messages: [...byId.values()].sort(
								(a, b) =>
									a.at.localeCompare(b.at) ||
									a.id.localeCompare(b.id),
							),
							isLoading: false,
							error: "",
							nextCursor: next.hasMore
								? next.nextCursor
								: undefined,
							unavailableCount:
								(cursor ? current.unavailableCount : 0) +
								next.unavailableCount,
						};
					});
				})
				.catch((cause: unknown) => {
					if (request.current !== token) return;
					setPage((current) => ({
						...current,
						isLoading: false,
						error:
							cause instanceof Error
								? cause.message
								: "Could not load this thread.",
					}));
				});
		},
		[actions, thread.id],
	);
	useEffect(() => {
		read();
		return () => {
			request.current = null;
		};
	}, [read]);
	return (
		<ConversationView
			thread={thread}
			page={page}
			onRetry={() => read()}
			onLoadOlder={() => read(page.nextCursor)}
		/>
	);
}

function ConversationView({
	thread,
	page,
	onRetry,
	onLoadOlder,
}: {
	thread: Thread;
	page: ConversationPage;
	onRetry?: () => void;
	onLoadOlder?: () => void;
}) {
	const { state } = useCollaborationSession();
	const addToChat = useAddToCurrentChat();
	const [isExpanded, setIsExpanded] = useState(false);
	const { messages } = page;
	const hidden = isExpanded
		? 0
		: Math.max(0, messages.length - PREVIEW_COUNT);
	const names = new Map(
		state.people.map((person) => [person.id, person.name]),
	);
	return (
		<Section
			title="Conversation"
			action={
				isExpanded &&
				page.nextCursor &&
				onLoadOlder && (
					<Button
						variant="ghost"
						size="sm"
						disabled={page.isLoading}
						onClick={onLoadOlder}
					>
						Load older
					</Button>
				)
			}
		>
			{page.error && (
				<Alert variant="destructive">
					<AlertDescription className="space-y-2">
						<P>{page.error}</P>
						{onRetry && (
							<Button
								type="button"
								variant="outline"
								disabled={page.isLoading}
								onClick={onRetry}
							>
								Try again
							</Button>
						)}
					</AlertDescription>
				</Alert>
			)}
			{messages.length ? (
				<div className="flex flex-col gap-5">
					{hidden > 0 && (
						<Button
							variant="outline"
							size="sm"
							className="self-start"
							onClick={() => setIsExpanded(true)}
						>
							Show {hidden} earlier message
							{hidden === 1 ? "" : "s"}
						</Button>
					)}
					{messages.slice(hidden).map((message) => {
						const name =
							message.fromName ||
							names.get(message.fromId) ||
							message.fromAddress ||
							"Participant";
						return (
							<ThreadMessage
								key={message.id}
								message={message}
								name={name}
								channel={thread.channel}
								isIncluded={!message.excluded}
								isEmpty={!message.text.trim()}
								isFlat
								action={
									// excluded mail never reaches the assistant, and a session thread has no source to read
									addToChat &&
									!message.excluded &&
									!thread.id.startsWith("session:") && (
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="h-7 pointer-coarse:min-h-11 px-2 text-muted-foreground text-xs"
											aria-label={`${addToChat.label}: ${thread.channel === "teams" ? "message" : "email"} from ${name}`}
											onClick={() =>
												addToChat.add(
													thread.id,
													message.id,
												)
											}
										>
											<MessageSquarePlus aria-hidden="true" />
											Add to chat
										</Button>
									)
								}
							/>
						);
					})}
				</div>
			) : page.isLoading ? (
				<output className="text-muted-foreground text-sm">
					Loading messages...
				</output>
			) : (
				!page.error && (
					<P className="text-muted-foreground text-sm">
						No messages from this thread are available.
					</P>
				)
			)}
			{page.unavailableCount > 0 && (
				<Small className="text-muted-foreground text-xs">
					{page.unavailableCount} message
					{page.unavailableCount === 1 ? " is" : "s are"} no longer
					available from the source.
				</Small>
			)}
		</Section>
	);
}
