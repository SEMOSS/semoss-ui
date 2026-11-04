import { X } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { SaveTopicFileButton } from "@/features/topic-files/components/save-topic-file-button";
import type { UploadedRoomFile } from "../api/upload-room-files";
import type { RoomSource } from "../source-import/room-source";

interface RoomContextFilesProps {
	/** Saved chat owning these files; absent for an unsent draft. */
	roomId?: string;
	/** Session-owned files queued for the next message. */
	files: readonly UploadedRoomFile[];
	/** Removes a queued file without deleting the saved file. */
	onRemove: (path: string) => void;
	/** Prevents changing the queue while the composer is unavailable. */
	isDisabled?: boolean;
	/** Give the imported conversation a readable label; retain the saved filename. */
	source?: RoomSource | null;
}

/** The same removable saved-file queue in a draft and a saved conversation. */
export function RoomContextFiles({
	files,
	roomId,
	onRemove,
	isDisabled = false,
	source,
}: RoomContextFilesProps) {
	const { t } = useTranslation("room");
	if (!files.length) return null;
	return (
		<ul
			aria-label={t("contextItems.label")}
			className="flex min-w-0 flex-wrap gap-2 px-3 pt-3"
		>
			{files.map((file) => (
				<li
					key={file.fileLocation}
					className="flex min-w-0 max-w-full items-center gap-1 rounded-md border border-border py-1 ps-3 pe-1 text-sm"
				>
					<span
						className="min-w-0 flex-1 truncate"
						title={file.fileName}
					>
						{source?.file.fileLocation === file.fileLocation
							? source.channel === "email"
								? "Email thread"
								: source.channel === "teams"
									? "Teams conversation"
									: "Source conversation"
							: file.fileName}
					</span>
					{roomId && (
						<SaveTopicFileButton
							roomId={roomId}
							filePath={file.fileLocation}
							fileName={file.fileName}
							isDisabled={isDisabled}
						/>
					)}
					<Tooltip disableHoverableContent={false}>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className="pointer-coarse:size-11 shrink-0"
								aria-label={t("contextItems.remove", {
									name: file.fileName,
								})}
								disabled={isDisabled}
								onClick={() => onRemove(file.fileLocation)}
							>
								<X aria-hidden="true" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{t("contextItems.remove", { name: file.fileName })}
						</TooltipContent>
					</Tooltip>
				</li>
			))}
		</ul>
	);
}
