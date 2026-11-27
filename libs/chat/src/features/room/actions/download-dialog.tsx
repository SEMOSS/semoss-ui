import { FileIcon, FileTextIcon, type LucideIcon } from "lucide-react";
import { type RefObject, useState } from "react";
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

/** A document format the backend can export to. */
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

/** Props for {@link DownloadDialog}. */
interface DownloadDialogProps {
	/** Whether the dialog is open. */
	open: boolean;
	/** Opens or closes the dialog; a finished download closes it. */
	onOpenChange: (open: boolean) => void;
	/** Downloads in the format picked; rejects with why it failed. */
	onDownload: (format: DownloadFormat) => Promise<void>;
	/** The namespace of the dialog's copy: a room's (`sidebar`) or a response's (`chat`). */
	ns: "sidebar" | "chat";
	/** The button focus goes back to once the dialog closes. */
	returnFocusRef?: RefObject<HTMLButtonElement | null>;
}

/**
 * Download a room's conversation or one response as a Word or PDF document.
 * The chosen format shows a spinner while it is made; a failure says why and
 * keeps the dialog open.
 */
export const DownloadDialog = ({
	open,
	onOpenChange,
	onDownload,
	ns,
	returnFocusRef,
}: DownloadDialogProps) => {
	const { t } = useTranslation([ns, "sidebar"]);
	// the format being downloaded, which locks every button until it lands
	const [downloadingFormat, setDownloadingFormat] =
		useState<DownloadFormat | null>(null);

	/**
	 * Download in `format`, then close the dialog.
	 *
	 * @param format - The document's format.
	 */
	const handleDownload = async (format: DownloadFormat) => {
		setDownloadingFormat(format);
		try {
			await onDownload(format);
			toast.success(
				t(`${ns}:download.success`, { format: format.toUpperCase() }),
			);
			onOpenChange(false);
		} catch (e) {
			toast.error(getErrorMessage(e) || t(`${ns}:download.failed`));
		} finally {
			setDownloadingFormat(null);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="sm:max-w-md"
				onCloseAutoFocus={
					returnFocusRef
						? (event) => {
								event.preventDefault();
								returnFocusRef.current?.focus();
							}
						: undefined
				}
			>
				<DialogHeader>
					<DialogTitle>{t(`${ns}:download.title`)}</DialogTitle>
					<DialogDescription>
						{t(`${ns}:download.description`)}
					</DialogDescription>
				</DialogHeader>
				<div className="grid grid-cols-2 gap-3 py-4">
					{FORMATS.map(({ format, icon: Icon, extension }) => {
						const label = t(`sidebar:download.${format}`);
						return (
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
									<>
										<Spinner className="size-4" />
										{/* the spinner keeps the button's name */}
										<span className="sr-only">{label}</span>
									</>
								) : (
									<>
										<Icon
											aria-hidden="true"
											className="mb-1 size-6"
										/>
										<span className="font-medium">
											{label}
										</span>
										<span className="text-muted-foreground text-xs">
											{extension}
										</span>
									</>
								)}
							</Button>
						);
					})}
				</div>
			</DialogContent>
		</Dialog>
	);
};
