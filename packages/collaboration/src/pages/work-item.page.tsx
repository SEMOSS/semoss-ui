import { Navigate, useParams } from "react-router";
import { Small } from "@semoss/ui/next";
import { CollaborationPage } from "@/features/collaboration/components/collaboration-page";
import { useWorkItems } from "@/features/collaboration/components/work-items-list";
import { LandingChatComposer } from "@/features/daily-chat/landing-chat-composer";
import { roomPath } from "@/lib/workspace-paths";

/** Start the room for one work item; once it has one, go straight there. */
export function WorkItemPage() {
	const { taskId = "" } = useParams();
	const { items, error } = useWorkItems();
	const item = items?.find((i) => i.id === taskId);
	if (item?.roomId) return <Navigate to={roomPath(item.roomId)} replace />;
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
						<LandingChatComposer
							topicId={item.topicId}
							taskId={item.id}
						/>
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
