import { useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@semoss/ui/next";
import type { UploadedRoomFile } from "@/features/rooms/api/upload-room-files";
import { TopicFileList } from "./topic-file-list";

interface RoomTopicFilesProps {
	/** The saved collaboration chat whose linked topics grant access. */
	roomId: string;
	/** Queues a copied file without sending a message. */
	onAttach: (file: UploadedRoomFile) => void;
	/** Prevent copying while a message is being sent or run. */
	isDisabled: boolean;
}
/** On-demand file panel next to the chat's topic controls. */
export function RoomTopicFiles({
	roomId,
	onAttach,
	isDisabled,
}: RoomTopicFilesProps) {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button type="button" variant="ghost" size="sm">
					Topic files
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-full overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Topic files</DialogTitle>
					<DialogDescription>
						Files from topics linked to this chat. Add one to your
						next message without uploading it again.
					</DialogDescription>
				</DialogHeader>
				{isOpen && (
					<TopicFileList
						key={roomId}
						roomId={roomId}
						isDisabled={isDisabled}
						onAttach={(file) => {
							onAttach(file);
							setIsOpen(false);
						}}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}
