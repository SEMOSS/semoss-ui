import { Check, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Button,
	P,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { TopicChip } from "@/features/collaboration/components/topic-chip";
import { useCollaborationResource } from "@/features/collaboration/live/work-updates.context";
import type { Topic } from "@/features/collaboration/state/collaboration.types";
import { useOptionalCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { ROOM_TREE_CHANGED } from "@/features/room-tree/room-tree-events";
import {
	linkRoomTopic,
	listRoomTopics,
	type RoomTopic,
} from "../api/room-topics";

/** The chat's topics, read again after each turn so Brain's tags show up as the owner chats. */
export function useRoomTopics(roomId: string, isRunning: boolean) {
	const { actions } = useInsight();
	const [topics, setTopics] = useState<RoomTopic[] | null>(null);
	const wasRunning = useRef(isRunning);
	const generation = useRef(0);
	const saving = useRef(false);
	const [error, setError] = useState("");
	const [isSaving, setSaving] = useState(false);
	const [isLoading, setLoading] = useState(false);

	const refresh = useCallback(
		async (force = true) => {
			if (!actions || !roomId) return;
			const token = ++generation.current;
			setLoading(true);
			try {
				const rows = await listRoomTopics(actions, roomId, force);
				if (token === generation.current) {
					setTopics(rows);
					setError("");
				}
			} catch (cause) {
				if (token === generation.current)
					setError(
						cause instanceof Error
							? cause.message
							: "Could not load room topics.",
					);
			} finally {
				if (token === generation.current) setLoading(false);
			}
		},
		[actions, roomId],
	);

	useEffect(() => {
		setTopics(null);
		void refresh(false);
		return () => {
			generation.current++;
		};
	}, [refresh]);
	useEffect(() => {
		const changed = (event: Event): void => {
			const detail = (event as CustomEvent).detail;
			if (
				detail?.actions !== actions ||
				detail.roomId !== roomId ||
				!detail.topics
			)
				return;
			setTopics(detail.topics);
		};
		window.addEventListener(ROOM_TREE_CHANGED, changed);
		return () => window.removeEventListener(ROOM_TREE_CHANGED, changed);
	}, [actions, roomId]);

	useEffect(() => {
		const finished = wasRunning.current && !isRunning;
		wasRunning.current = isRunning;
		if (!finished) return;
		void refresh();
	}, [isRunning, refresh]);

	const change = useCallback(
		async (topicId: string, remove: boolean) => {
			if (!actions || saving.current) return;
			saving.current = true;
			setSaving(true);
			setLoading(false);
			const token = ++generation.current;
			try {
				const rows = await linkRoomTopic(
					actions,
					roomId,
					topicId,
					remove,
				);
				if (token === generation.current) {
					setTopics(rows);
					setError("");
				}
			} catch (cause) {
				const message =
					cause instanceof Error
						? cause.message
						: "Could not save room topics.";
				if (token === generation.current) {
					setError(message);
					toast.error(message);
				}
			} finally {
				saving.current = false;
				setSaving(false);
			}
		},
		[actions, roomId],
	);

	return { topics, change, error, refresh, isSaving, isLoading };
}

/** Topic chips in the chat header: linked topics, Brain's suggestions to accept or dismiss, and a picker. */
export function RoomTopics({
	roomId,
	isRunning,
}: {
	roomId: string;
	isRunning: boolean;
}) {
	const session = useOptionalCollaborationSession();
	const { topics, change, error, refresh, isSaving, isLoading } =
		useRoomTopics(roomId, isRunning);
	const [open, setOpen] = useState(false);
	const directory = useCollaborationResource("directory");
	if (!session) return null;

	const byId = new Map<string, Topic>(
		session.state.topics.map((topic) => [topic.id, topic]),
	);
	const shown = (topics ?? []).filter((t) => t.state !== "dismissed");
	const onChat = new Set(
		(topics ?? [])
			.filter((t) => t.state !== "dismissed")
			.map((t) => t.topicId),
	);
	const choices = [
		...session.state.topics.filter(
			(topic) => topic.status !== "archived" && !onChat.has(topic.id),
		),
		...(topics ?? [])
			.filter(
				(topic) =>
					topic.state === "dismissed" && !byId.has(topic.topicId),
			)
			.map((topic) => ({
				id: topic.topicId,
				name: topic.name || "Linked topic",
				status: undefined,
			})),
	];

	return (
		<fieldset
			className="flex min-w-0 shrink items-center gap-1 border-0 p-0"
			aria-label="Chat topics"
			disabled={isSaving}
		>
			<div className="flex min-w-0 items-center gap-1 overflow-x-auto">
				{shown.map((t) => {
					const savedTopic = byId.get(t.topicId);
					const topic = savedTopic ?? {
						id: t.topicId,
						name: t.name || "Linked topic",
						short: t.name || "Linked topic",
					};
					const suggested = t.state === "suggested";
					const byBrain =
						t.origin === "brain" || t.origin === "agent";
					return (
						<span
							key={t.topicId}
							className="inline-flex items-center gap-0.5"
						>
							<Tooltip>
								<TooltipTrigger asChild>
									<span>
										<TopicChip
											topic={topic}
											suggested={suggested}
											onRemove={() =>
												void change(t.topicId, true)
											}
											removeLabel={
												suggested
													? `Dismiss ${topic.short}`
													: `Remove ${topic.short} from this chat`
											}
										/>
									</span>
								</TooltipTrigger>
								<TooltipContent>
									{suggested
										? `Brain thinks this chat is about ${topic.name}`
										: byBrain
											? `Brain tagged this chat ${topic.name}; remove it if that is wrong`
											: `This chat is about ${topic.name}`}
								</TooltipContent>
							</Tooltip>
							{suggested && (
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									className="size-6 text-muted-foreground"
									aria-label={`Accept ${topic.short}`}
									disabled={
										savedTopic?.status === "suggested" ||
										savedTopic?.status === "archived" ||
										isSaving
									}
									onClick={() =>
										void change(t.topicId, false)
									}
								>
									<Check aria-hidden="true" />
								</Button>
							)}
						</span>
					);
				})}
			</div>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="h-7 shrink-0 gap-1 px-2 text-muted-foreground"
						aria-label="Add a topic to this chat"
					>
						<Plus aria-hidden="true" className="size-3.5" />
						{shown.length === 0 && (
							<span className="text-xs">Topic</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent
					align="start"
					className="max-h-72 w-64 overflow-y-auto p-1"
					aria-label="Add a topic"
				>
					<div className="flex flex-wrap gap-2 border-b p-2">
						<Button
							type="button"
							size="sm"
							variant="ghost"
							disabled={isLoading || isSaving}
							onClick={() => void refresh()}
						>
							Refresh room topics
						</Button>
						<Button
							type="button"
							size="sm"
							variant="ghost"
							disabled={directory.isLoading || isSaving}
							onClick={directory.refresh}
						>
							Refresh topic directory
						</Button>
					</div>
					{isLoading && (
						<output className="p-2 text-sm">
							Loading room topics…
						</output>
					)}
					{error && (
						<P
							role="alert"
							className="p-2 text-destructive text-sm"
						>
							{error}
						</P>
					)}
					{directory.error && (
						<P
							role="alert"
							className="p-2 text-destructive text-sm"
						>
							{directory.error}
						</P>
					)}
					{session.state.topics.some(
						(topic) => topic.status === "suggested",
					) && (
						<P className="p-2 text-muted-foreground text-sm">
							Accept suggested topics in My topics before linking
							them so chats can use their saved context.
						</P>
					)}
					{choices.length === 0 ? (
						<p className="px-2 py-1.5 text-muted-foreground text-sm">
							{directory.isLoading
								? "Loading topics…"
								: directory.complete
									? "No other topics"
									: "Refresh the topic directory to see available topics."}
						</p>
					) : (
						choices.map((topic) => (
							<Button
								key={topic.id}
								type="button"
								variant="ghost"
								disabled={
									isSaving ||
									!topics ||
									topic.status === "suggested"
								}
								className="h-auto min-h-9 w-full justify-start whitespace-normal px-2 text-left font-normal text-sm"
								onClick={() => {
									setOpen(false);
									void change(topic.id, false);
								}}
							>
								{topics?.some(
									(row) =>
										row.topicId === topic.id &&
										row.state === "dismissed",
								)
									? `Restore ${topic.name}`
									: topic.name}
								{topic.status === "suggested" &&
									" · accept in My topics first"}
							</Button>
						))
					)}
				</PopoverContent>
			</Popover>
		</fieldset>
	);
}
