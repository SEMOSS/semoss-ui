import { Navigate, useParams } from "react-router";
import { Small } from "@semoss/ui/next";
import { CollaborationPage } from "@/features/collaboration/components/collaboration-page";
import {
	TaskContextView,
	useTaskContext,
} from "@/features/collaboration/components/task-context";
import { useWorkItems } from "@/features/collaboration/components/work-items-list";
import { LandingChatComposer } from "@/features/daily-chat/landing-chat-composer";
import { roomPath } from "@/lib/workspace-paths";

/** Start the room for one work item; once it has one, go straight there. */
export function WorkItemPage() {
	const { taskId = "" } = useParams();
	const { items, error } = useWorkItems();
	const item = items?.find((i) => i.id === taskId);
	const context = useTaskContext({ taskId });
	if (item?.roomId) return <Navigate to={roomPath(item.roomId)} replace />;
	// a finished item is not in the open list, but the page still shows it so it can be reopened
	const shown =
		item ??
		(context.task
			? { title: context.task.title, id: taskId, topicId: undefined }
			: undefined);
	return (
		<CollaborationPage>
			<div className="mx-auto w-full max-w-3xl pt-4 pb-12 sm:pt-12">
				{items === null || (!shown && context.loading) ? (
					<Small className="text-muted-foreground">
						{error || "Loading..."}
					</Small>
				) : shown ? (
					<>
						<h1 className="mb-1 font-semibold text-2xl">
							{context.task?.title || shown.title}
						</h1>
						<Small className="mb-6 block text-muted-foreground">
							Ask anything about this item. The assistant sees its
							steps and the mail and chats it came from.
						</Small>
						<LandingChatComposer
							topicId={shown.topicId}
							taskId={shown.id}
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
										steps={context.steps}
										item={context.item}
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
