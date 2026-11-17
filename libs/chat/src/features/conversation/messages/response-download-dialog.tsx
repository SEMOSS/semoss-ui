import { Loader2Icon } from "lucide-react";
import { type RefObject, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	toast,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import type { ResponseMessageStore } from "../../room/store/response-message.store";

/** A document format a response downloads as. */
type DownloadFormat = "word" | "pdf";

/** Props for {@link ResponseDownloadDialog}. */
interface ResponseDownloadDialogProps {
	/** The response to download. */
	message: ResponseMessageStore;
	/** Whether the dialog is open. */
	open: boolean;
	/** Opens or closes the dialog; a finished download closes it. */
	onOpenChange: (open: boolean) => void;
	/** The button focus goes back to once the dialog closes. */
	returnFocusRef: RefObject<HTMLButtonElement | null>;
}

/**
 * Download a response as a Word document or a PDF. The chosen format shows a
 * spinner while it is made; a failure says why and keeps the dialog open.
 */
export const ResponseDownloadDialog = ({
	message,
	open,
	onOpenChange,
	returnFocusRef,
}: ResponseDownloadDialogProps) => {
	const { t } = useTranslation("chat");
	const [downloadingFormat, setDownloadingFormat] =
		useState<DownloadFormat | null>(null);

	const formats = [
		{
			value: "word",
			label: t("sidebar:download.word"),
			extension: ".docx",
		},
		{ value: "pdf", label: t("sidebar:download.pdf"), extension: ".pdf" },
	] as const;

	/**
	 * Download the response as a document, then close the dialog.
	 *
	 * @param format - The document's format.
	 */
	const handleDownload = async (format: DownloadFormat) => {
		setDownloadingFormat(format);
		try {
			await message.downloadResponse(format);
			toast.success(
				t("download.success", { format: format.toUpperCase() }),
			);
			onOpenChange(false);
		} catch (e: unknown) {
			toast.error(getErrorMessage(e) || t("download.failed"));
		} finally {
			setDownloadingFormat(null);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="sm:max-w-md"
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					returnFocusRef.current?.focus();
				}}
			>
				<DialogHeader>
					<DialogTitle>{t("download.title")}</DialogTitle>
					<DialogDescription>
						{t("download.description")}
					</DialogDescription>
				</DialogHeader>
				<div className="grid grid-cols-2 gap-3 py-4">
					{formats.map((format) => (
						<Button
							key={format.value}
							variant="outline"
							className="h-auto flex-col gap-1 p-4"
							disabled={downloadingFormat !== null}
							aria-busy={downloadingFormat === format.value}
							onClick={() => handleDownload(format.value)}
						>
							{downloadingFormat === format.value ? (
								<>
									<Loader2Icon
										aria-hidden="true"
										className="size-4 animate-spin"
									/>
									{/* the spinner keeps the button's name */}
									<span className="sr-only">
										{format.label}
									</span>
								</>
							) : (
								<>
									<span className="font-medium">
										{format.label}
									</span>
									<span className="text-muted-foreground text-xs">
										{format.extension}
									</span>
								</>
							)}
						</Button>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
};
