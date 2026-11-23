import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { Small } from "@semoss/ui/next";
import { CollaborationPage } from "@/features/collaboration/components/collaboration-page";
import { RoomSelector } from "@/features/collaboration/components/room-selector";
import {
	TaskContextView,
	useTaskContext,
} from "@/features/collaboration/components/task-context";
import {
	roomsOf,
	useWorkItems,
} from "@/features/collaboration/components/work-items-list";
import { LandingChatComposer } from "@/features/daily-chat/landing-chat-composer";
import { roomPath } from "@/lib/workspace-paths";

/** Start a new chat for one work item; show room selector if other chats exist. */
export function WorkItemPage() {
	const { taskId = "" } = useParams();
	const navigate = useNavigate();
	const { items, error } = useWorkItems();
	const item = items?.find((i) => i.id === taskId);
	const rooms = item ? roomsOf(item) : [];
	const context = useTaskContext({ taskId });
	// a finished item is not in the open list, but the page still shows it so it can be reopened
	const shown =
		item ??
		(context.task
			? { title: context.task.title, id: taskId, topicId: undefined }
			: undefined);
	return (
		<CollaborationPage>
			<div className="mx-auto w-full max-w-3xl pt-4 pb-12 sm:pt-12">
				<Link
					to="/work"
					className="mb-4 inline-flex items-center gap-1.5 rounded-sm text-muted-foreground text-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
				>
					<ArrowLeft aria-hidden="true" className="size-4" />
					Work
				</Link>
				{items === null || (!shown && context.loading) ? (
					<Small className="text-muted-foreground">
						{error || "Loading..."}
					</Small>
				) : shown ? (
					<>
						<h1 className="mb-6 font-semibold text-2xl">
							{context.task?.title || shown.title}
						</h1>
						{context.task ? (
							<section
								aria-label="Where it stands"
								className="mb-10 space-y-3"
							>
								<h2 className="font-display font-semibold text-base">
									Where it stands
								</h2>
								<div className="overflow-hidden rounded-xl border bg-card">
									<TaskContextView
										task={context.task}
										steps={context.steps}
										item={context.item}
										className="p-5"
									/>
								</div>
							</section>
						) : null}
						<section
							aria-label="Ask about this item"
							className="space-y-3"
						>
							<div className="space-y-1">
								<h2 className="font-display font-semibold text-base">
									Ask about this item
								</h2>
								<Small className="block text-muted-foreground">
									Your Digital Twin sees its steps and the
									mail and chats it came from.
								</Small>
							</div>
							{rooms.length > 0 && (
								<RoomSelector
									rooms={rooms}
									onRoomSelect={(roomId) =>
										navigate(roomPath(roomId))
									}
									label={
										rooms.length === 1
											? "View earlier chat"
											: "View earlier chats"
									}
								/>
							)}
							<LandingChatComposer
								topicId={shown.topicId}
								taskId={shown.id}
							/>
						</section>
					</>
				) : (
					<Small className="text-muted-foreground">
						This work item is no longer open.
					</Small>
				)}
			</div>
		</CollaborationPage>
	);
}
