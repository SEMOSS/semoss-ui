import { useNavigate, useParams } from "react-router";
import { Small } from "@semoss/ui/next";
import { CollaborationPage } from "@/features/collaboration/components/collaboration-page";
import { RoomSelector } from "@/features/collaboration/components/room-selector";
import {
	TaskContextView,
	useTaskContext,
} from "@/features/collaboration/components/task-context";
import { useWorkItems } from "@/features/collaboration/components/work-items-list";
import { LandingChatComposer } from "@/features/daily-chat/landing-chat-composer";
import { roomPath } from "@/lib/workspace-paths";

/** Start a new chat for one work item; show room selector if other chats exist. */
export function WorkItemPage() {
	const { taskId = "" } = useParams();
	const navigate = useNavigate();
	const { items, error } = useWorkItems();
	const item = items?.find((i) => i.id === taskId);
	const context = useTaskContext({ taskId });
	return (
		<CollaborationPage>
			<div className="mx-auto w-full max-w-3xl pt-4 pb-12 sm:pt-12">
				{items === null ? (
					<Small className="text-muted-foreground">
						{error || "Loading..."}
					</Small>
				) : item ? (
					<>
						<h1 className="mb-1 font-semibold text-2xl">
							{item.title}
						</h1>
						<Small className="mb-6 block text-muted-foreground">
							Ask anything about this item. The assistant sees its
							steps and the mail and chats it came from.
						</Small>
						{item.rooms && item.rooms.length > 0 && (
							<RoomSelector
								rooms={item.rooms}
								onRoomSelect={(roomId) =>
									navigate(roomPath(roomId))
								}
								label="View earlier chats"
							/>
						)}
						<LandingChatComposer
							topicId={item.topicId}
							taskId={item.id}
						/>
						{context.task ? (
							<section
								aria-label="Where it stands"
								className="mt-10 space-y-3"
							>
								<h2 className="font-display font-semibold text-base">
									Where it stands
								</h2>
								<div className="overflow-hidden rounded-xl border bg-card">
									<TaskContextView
										task={context.task}
										className="p-5"
									/>
								</div>
							</section>
						) : null}
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
