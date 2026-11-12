import { MoreHorizontal } from "lucide-react";
import { useId, useState } from "react";
import { useNavigate } from "react-router";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Label,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	toast,
} from "@semoss/ui/next";
import { topicPath } from "@/lib/workspace-paths";
import type { TopicLifecycleChange } from "../live/topic-lifecycle-api";
import { useWorkUpdates } from "../live/work-updates.context";
import type { Topic } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";

/** Confirm merging this topic into another one or deleting it, or open its checklists and conversation review. */
export function TopicActions({
	topic,
	threadCount,
	onEdit,
	onManageThreads,
	onManageChats,
	onManageFiles,
	onResort,
	onFindConversations,
}: {
	topic: Topic;
	threadCount: number;
	/** Opens the topic editor: name, description, kind and account. */
	onEdit?: () => void;
	/** Opens the checklist of the topic's threads, for adding and removing them by hand. */
	onManageThreads?: () => void;
	/** The same for its chats; absent where no server can save a chat's topic. */
	onManageChats?: () => void;
	/** The same for its OneDrive and Teams files; absent where no server can keep the links. */
	onManageFiles?: () => void;
	/** Re-checks the conversations already in the topic, for after narrowing it. */
	onResort?: () => void;
	/** Opens the review of existing conversations that fit; absent where no server can check them. */
	onFindConversations?: () => void;
}) {
	const { state, dispatch } = useCollaborationSession();
	const navigate = useNavigate();
	const fieldId = useId();
	const updates = useWorkUpdates();
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState("");
	const [dialog, setDialog] = useState<"merge" | "delete" | null>(null);
	const [targetId, setTargetId] = useState("");
	// the reducer only merges records of the same kind (sample or live)
	const targets = state.topics.filter(
		(other) => other.id !== topic.id && other.isSample === topic.isSample,
	);
	const target = targets.find((other) => other.id === targetId);
	const close = () => {
		if (isPending) return;
		setDialog(null);
		setTargetId("");
	};

	async function changeLifecycle(
		change: TopicLifecycleChange,
	): Promise<void> {
		if (isPending) return;
		setIsPending(true);
		setError("");
		try {
			if (topic.isSample || !updates) {
				if (change.type === "delete")
					dispatch({ type: "topic.delete", topicId: topic.id });
				else
					dispatch({
						type: "topic.save",
						topic: { id: topic.id, status: change.status },
					});
			} else {
				if (!updates.changeTopic)
					throw new Error(
						"Topic actions are unavailable. Reload and try again.",
					);
				await updates.changeTopic(topic.id, change);
			}
			if (change.type === "delete") {
				setDialog(null);
				toast.success(`Deleted ${topic.name}.`);
				void navigate("/work/topics");
			} else {
				toast.success(
					change.status === "hibernated"
						? `Hibernated ${topic.name}.`
						: change.status === "archived"
							? `Archived ${topic.name}.`
							: `${topic.name} is active.`,
				);
			}
		} catch (cause: unknown) {
			setError(
				cause instanceof Error
					? cause.message
					: "The topic could not be changed.",
			);
		} finally {
			setIsPending(false);
		}
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="outline"
						size="icon-sm"
						aria-label="More topic actions"
						disabled={isPending}
					>
						<MoreHorizontal aria-hidden="true" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					{topic.status !== "suggested" &&
						(topic.status === "archived" ? (
							<DropdownMenuItem
								onSelect={() =>
									void changeLifecycle({
										type: "status",
										status: "active",
									})
								}
							>
								Restore topic
							</DropdownMenuItem>
						) : (
							<>
								<DropdownMenuItem
									onSelect={() =>
										void changeLifecycle({
											type: "status",
											status:
												topic.status === "hibernated"
													? "active"
													: "hibernated",
										})
									}
								>
									{topic.status === "hibernated"
										? "Wake topic"
										: "Hibernate topic"}
								</DropdownMenuItem>
								<DropdownMenuItem
									onSelect={() =>
										void changeLifecycle({
											type: "status",
											status: "archived",
										})
									}
								>
									Archive topic
								</DropdownMenuItem>
							</>
						))}
					{onEdit && (
						<DropdownMenuItem onSelect={onEdit}>
							Edit topic...
						</DropdownMenuItem>
					)}
					{onManageThreads && (
						<DropdownMenuItem onSelect={onManageThreads}>
							Add or remove emails and Teams chats...
						</DropdownMenuItem>
					)}
					{onManageChats && (
						<DropdownMenuItem onSelect={onManageChats}>
							Add or remove assistant chats...
						</DropdownMenuItem>
					)}
					{onManageFiles && (
						<DropdownMenuItem onSelect={onManageFiles}>
							Add or remove files...
						</DropdownMenuItem>
					)}
					{onFindConversations && (
						<DropdownMenuItem onSelect={onFindConversations}>
							Find conversations...
						</DropdownMenuItem>
					)}
					{onResort && (
						<DropdownMenuItem onSelect={onResort}>
							Re-sort conversations...
						</DropdownMenuItem>
					)}
					<DropdownMenuItem
						disabled={!targets.length}
						onSelect={() => setDialog("merge")}
					>
						Merge into another topic...
					</DropdownMenuItem>
					<DropdownMenuItem
						variant="destructive"
						onSelect={() => setDialog("delete")}
					>
						Delete topic
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			{error && dialog !== "delete" && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			<Dialog
				open={dialog === "merge"}
				onOpenChange={(open) => {
					if (!open) close();
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Merge {topic.name}</DialogTitle>
						<DialogDescription>
							Its {threadCount} threads, people, notes, keywords,
							and rules move to the topic you pick, and{" "}
							{topic.name} is removed.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2">
						<Label htmlFor={`${fieldId}-target`}>Merge into</Label>
						<Select value={targetId} onValueChange={setTargetId}>
							<SelectTrigger id={`${fieldId}-target`}>
								<SelectValue placeholder="Choose a topic" />
							</SelectTrigger>
							<SelectContent>
								{targets.map((other) => (
									<SelectItem key={other.id} value={other.id}>
										{other.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={close}>
							Cancel
						</Button>
						<Button
							type="button"
							disabled={!target}
							onClick={() => {
								if (!target) return;
								dispatch({
									type: "topic.merge",
									sourceId: topic.id,
									targetId: target.id,
								});
								close();
								toast.success(
									`Merged ${topic.name} into ${target.name}.`,
								);
								navigate(topicPath(target.id));
							}}
						>
							Merge
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			<Dialog
				open={dialog === "delete"}
				onOpenChange={(open) => {
					if (!open) close();
				}}
			>
				<DialogContent
					onEscapeKeyDown={(event) => {
						if (isPending) event.preventDefault();
					}}
					onInteractOutside={(event) => {
						if (isPending) event.preventDefault();
					}}
				>
					<DialogHeader>
						<DialogTitle>Delete {topic.name}?</DialogTitle>
						<DialogDescription>
							Its notes, people, and rules are removed, and{" "}
							{threadCount} threads lose this topic. The threads
							themselves stay.
						</DialogDescription>
					</DialogHeader>
					<P className="text-muted-foreground text-sm">
						This deletion cannot be undone.
					</P>
					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={isPending}
							onClick={close}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="destructive"
							disabled={isPending}
							onClick={() =>
								void changeLifecycle({ type: "delete" })
							}
						>
							{isPending ? "Deleting..." : "Delete topic"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
