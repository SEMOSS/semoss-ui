import { FileBadgeIcon, ImageIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { cn, Dialog, DialogContent, DialogTitle } from "@semoss/ui/next";
import type { AttachmentPreview } from "./attachment-icon";

/** Props for {@link AttachmentPreviewDialog}. */
interface AttachmentPreviewDialogProps {
	/** The attachment to show; the dialog is closed while it is null. */
	preview: AttachmentPreview | null;
	/** Closes the dialog. */
	onClose: () => void;
}

/**
 * An attachment sent inline, opened full size: an image, or a PDF in the
 * browser's own viewer. The dialog is named by the file.
 */
export const AttachmentPreviewDialog = ({
	preview,
	onClose,
}: AttachmentPreviewDialogProps) => {
	const { t } = useTranslation("chat");
	const isImage = preview?.kind === "image";
	const Icon = isImage ? ImageIcon : FileBadgeIcon;

	return (
		<Dialog
			open={preview !== null}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent
				className={cn(
					"flex flex-col gap-3 p-4",
					isImage
						? "h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)]"
						: "h-[80vh] max-w-4xl",
				)}
				aria-describedby={undefined}
			>
				<div className="flex items-center gap-2 border-b pb-3">
					<div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
						<Icon
							aria-hidden="true"
							className="size-4 text-muted-foreground"
						/>
					</div>
					<DialogTitle
						className="truncate font-normal text-muted-foreground text-sm leading-normal"
						title={preview?.fileName}
					>
						{preview?.fileName}
					</DialogTitle>
				</div>
				{preview?.kind === "image" && (
					<div className="flex flex-1 items-center justify-center overflow-hidden">
						<img
							className="max-h-full max-w-full rounded object-contain"
							src={preview.src}
							alt={preview.fileName}
						/>
					</div>
				)}
				{preview?.kind === "pdf" && (
					<object
						className="flex-1"
						data={preview.src}
						type="application/pdf"
						aria-label={t("attachments.previewOf", {
							name: preview.fileName,
						})}
					>
						<p className="p-4 text-muted-foreground text-sm">
							{t("common:fileExplorer.pdfNotSupported")}
						</p>
					</object>
				)}
			</DialogContent>
		</Dialog>
	);
};
