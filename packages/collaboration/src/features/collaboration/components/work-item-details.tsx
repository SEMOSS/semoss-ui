import { useRef, useState } from "react";
import { Link } from "react-router";
import { usePixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	P,
	Small,
	toast,
} from "@semoss/ui/next";
import { LandingChatComposer } from "@/features/daily-chat/landing-chat-composer";
import { pixel } from "@/lib/pixel";
import { roomPath } from "@/lib/workspace-paths";
import { type WorkItemRecord, workItemSchema } from "../live/work-item-api";
import { useRecordIds, useWorkUpdates } from "../live/work-updates.context";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { TaskContextView } from "./task-context";
import { WorkItemEditor } from "./work-item-editor";

/** The same management pane for pending, accepted, and explicitly opened inactive work. */
export function WorkItemDetails({
	taskId,
}: {
	/** Owner-scoped work item ID; details do not depend on the filtered Work list. */
	taskId: string;
}) {
	const query = usePixel<unknown>(pixel("WorkGetWork", { taskId }));
	const updates = useWorkUpdates();
	const { state } = useCollaborationSession();
	const { localId } = useRecordIds();
	const editRef = useRef<HTMLButtonElement>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isStartingRoom, setIsStartingRoom] = useState(false);
	const parsed =
		query.status === "SUCCESS"
			? workItemSchema.safeParse(query.data)
			: null;

	if (query.status === "ERROR" || (parsed && !parsed.success))
		return (
			<Alert variant="destructive">
				<AlertDescription>
					{query.error?.message ??
						"The work item details could not be read."}
				</AlertDescription>
				<Button variant="outline" size="sm" onClick={query.refresh}>
					Retry
				</Button>
			</Alert>
		);
	if (!parsed?.success)
		return (
			<output className="block p-4 text-muted-foreground">
				Loading work item...
			</output>
		);
	const item = parsed.data;
	if (item.id !== taskId)
		return (
			<Alert variant="destructive">
				<AlertDescription>
					The server returned a different work item.
				</AlertDescription>
			</Alert>
		);
	const latestRoom = item.roomId || item.rooms[0]?.roomId;
	const closeEditor = (): void => {
		setIsEditing(false);
		requestAnimationFrame(() => editRef.current?.focus());
	};
	const waitingOn = item.waitingOnPersonId
		? (state.people.find(
				(person) => person.id === localId(item.waitingOnPersonId),
			)?.name ?? "Selected person")
		: "";
	const saved = (next: WorkItemRecord): void => {
		query.update(next);
		closeEditor();
		toast.success("Work item updated.");
		updates?.refresh();
	};

	return (
		<div className="min-w-0 space-y-5 p-4 sm:p-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="min-w-0 space-y-1">
					<h2 className="break-words font-semibold text-lg">
						{item.title}
					</h2>
					<div className="flex flex-wrap gap-2">
						<Badge variant="outline">
							{item.state === "proposed"
								? "Pending review"
								: item.status}
						</Badge>
						{item.topics.map((topic) => (
							<Badge key={topic.id} variant="secondary">
								{topic.name}
							</Badge>
						))}
					</div>
				</div>
				{!isEditing && (
					<Button
						ref={editRef}
						variant="outline"
						size="sm"
						onClick={() => setIsEditing(true)}
					>
						Edit work item
					</Button>
				)}
			</div>
			{isEditing ? (
				<WorkItemEditor
					key={item.id}
					item={item}
					onSaved={saved}
					onCancel={closeEditor}
				/>
			) : (
				<>
					{(waitingOn || item.due || item.priority) && (
						<dl className="grid gap-2 text-sm sm:grid-cols-3">
							{waitingOn && (
								<div>
									<dt className="text-muted-foreground">
										Waiting on
									</dt>
									<dd>{waitingOn}</dd>
								</div>
							)}
							{item.due && (
								<div>
									<dt className="text-muted-foreground">
										Due date
									</dt>
									<dd>{item.due.slice(0, 10)}</dd>
								</div>
							)}
							{item.priority && (
								<div>
									<dt className="text-muted-foreground">
										Priority
									</dt>
									<dd className="capitalize">
										{item.priority}
									</dd>
								</div>
							)}
						</dl>
					)}
					{item.description && (
						<P className="whitespace-pre-wrap text-sm">
							{item.description}
						</P>
					)}
					{item.nextStep && (
						<P className="text-sm">
							<span className="font-medium">Next: </span>
							{item.nextStep}
						</P>
					)}
					<div className="flex flex-wrap gap-2">
						{latestRoom && (
							<Button asChild size="sm" variant="outline">
								<Link to={roomPath(latestRoom)}>
									Open latest room
								</Link>
							</Button>
						)}
						<Button
							size="sm"
							variant="outline"
							onClick={() =>
								setIsStartingRoom((current) => !current)
							}
						>
							{isStartingRoom ? "Cancel new room" : "New room"}
						</Button>
					</div>
					{isStartingRoom && (
						<LandingChatComposer
							taskId={item.id}
							topicId={item.topics[0]?.id}
						/>
					)}
					<section aria-label="Work item rooms" className="space-y-2">
						<h3 className="font-medium text-sm">Rooms</h3>
						{item.rooms.length ? (
							<ul className="space-y-2">
								{item.rooms.map((room, index) => (
									<li key={room.roomId}>
										<Link
											to={roomPath(room.roomId)}
											className="inline-flex min-h-8 items-center text-sm underline underline-offset-4"
										>
											{room.linkedAt
												? `Conversation · ${new Date(room.linkedAt).toLocaleString()}`
												: `Conversation ${item.rooms.length - index}`}
											{room.roomId === latestRoom
												? " (latest)"
												: ""}
										</Link>
									</li>
								))}
							</ul>
						) : (
							<Small className="text-muted-foreground">
								No rooms yet. You can manage this item without
								starting a chat.
							</Small>
						)}
					</section>
					<TaskContextView
						task={{
							...item,
							threads: item.threads.map((thread) => ({
								id: thread.threadId,
								subject: thread.subject,
								source: thread.source,
							})),
						}}
					/>
				</>
			)}
		</div>
	);
}
