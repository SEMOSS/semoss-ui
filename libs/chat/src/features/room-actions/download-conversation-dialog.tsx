import { FileIcon, FileTextIcon, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { useChatSession } from "../chat/use-chat-session";

/** A document format the backend can export a conversation to. */
type DownloadFormat = "word" | "pdf";

/** The formats offered, one button each, in order. */
const FORMATS: {
	format: DownloadFormat;
	icon: LucideIcon;
	extension: string;
}[] = [
	{ format: "word", icon: FileTextIcon, extension: ".docx" },
	{ format: "pdf", icon: FileIcon, extension: ".pdf" },
];

/** Props for {@link DownloadConversationDialog}. */
interface DownloadConversationDialogProps {
	/** The room to download, or null while the dialog is closed. */
	roomId: string | null;
	/** Whether the dialog is open. */
	open: boolean;
	/** Called when the dialog opens or closes, including after a download. */
	onOpenChange: (open: boolean) => void;
}

/** Downloads a room's conversation as a Word or PDF document. */
export function DownloadConversationDialog({
	roomId,
	open,
	onOpenChange,
}: DownloadConversationDialogProps) {
	const { t } = useTranslation("sidebar");
	const { chat } = useChatSession();
	// the format being downloaded, which locks every button until it lands
	const [downloadingFormat, setDownloadingFormat] =
		useState<DownloadFormat | null>(null);

	/** Downloads the room in `format`, closing the dialog once it lands. */
	const handleDownload = async (format: DownloadFormat) => {
		if (!roomId) return;
		setDownloadingFormat(format);
		try {
			await chat.downloadConversation(roomId, format);
			toast.success(
				t("download.success", { format: format.toUpperCase() }),
			);
			onOpenChange(false);
		} catch (e) {
			toast.error(getErrorMessage(e) || t("download.failed"));
		} finally {
			setDownloadingFormat(null);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t("download.title")}</DialogTitle>
					<DialogDescription>
						{t("download.description")}
					</DialogDescription>
				</DialogHeader>
				<div className="grid grid-cols-2 gap-3 py-4">
					{FORMATS.map(({ format, icon: Icon, extension }) => (
						<Button
							key={format}
							variant="outline"
							className="h-auto flex-col gap-1 p-4"
							disabled={downloadingFormat !== null}
							aria-busy={
								downloadingFormat === format || undefined
							}
							onClick={() => void handleDownload(format)}
						>
							{downloadingFormat === format ? (
								<Spinner className="size-4" />
							) : (
								<>
									<Icon
										aria-hidden="true"
										className="mb-1 size-6"
									/>
									<span className="font-medium">
										{t(`download.${format}`)}
									</span>
									<span className="text-muted-foreground text-xs">
										{extension}
									</span>
								</>
							)}
						</Button>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
}
