import {
	CheckIcon,
	CopyIcon,
	DownloadIcon,
	ThumbsDownIcon,
	ThumbsUpIcon,
} from "lucide-react";
import { useState } from "react";
import { copyToClipboard } from "@semoss/shared";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
export interface MessageFeedbackToolbarProps {
	/** Current rating, if any — undefined means not yet rated. */
	rating?: boolean;
	/** Calling with the already-active rating clears it — matches ChatSession.recordFeedback's toggle-off behavior. */
	onRate: (rating: boolean) => void;
	/** Full plain-text content of the message, for the Copy button. */
	textContent: string;
	/** Omit to hide the Download action entirely — e.g. a host not ready to wire up ChatSession.downloadMessage yet. */
	onDownload?: (format: "word" | "pdf") => Promise<void>;
}

const DOWNLOAD_FORMATS = [
	{ value: "word" as const, label: "Word Document" },
	{ value: "pdf" as const, label: "PDF Document" },
];

/**
 * Per-response action row (thumbs up/down, copy, download) — ported from
 * playground's real response-message.tsx toolbar. Deliberately excludes:
 * regenerate/rewrite (message branching is out of scope, see
 * docs/chat-components/PLAN.md), the optional feedback-text comment dialog
 * (a playground feature-flag this pass didn't need to replicate), and
 * copy-image (no MEDIA part type in @semoss/chat yet).
 */
export function MessageFeedbackToolbar({
	rating,
	onRate,
	textContent,
	onDownload,
}: MessageFeedbackToolbarProps) {
	const [copied, setCopied] = useState(false);
	const [isDownloadOpen, setIsDownloadOpen] = useState(false);
	const [downloadingFormat, setDownloadingFormat] = useState<
		"word" | "pdf" | null
	>(null);

	function handleCopy() {
		copyToClipboard(
			textContent,
			() => {
				setCopied(true);
				setTimeout(() => setCopied(false), 1500);
			},
			() => {
				// Low-stakes convenience action — see CopyButton's own comment.
			},
		);
	}

	async function handleDownload(format: "word" | "pdf") {
		if (!onDownload) return;
		setDownloadingFormat(format);
		try {
			await onDownload(format);
			setIsDownloadOpen(false);
		} finally {
			setDownloadingFormat(null);
		}
	}

	return (
		<div
			data-slot="message-feedback-toolbar"
			className="flex items-center gap-0.5 pt-2"
		>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Good response"
						onClick={() => onRate(true)}
					>
						<ThumbsUpIcon
							className={
								rating === true ? "fill-current" : undefined
							}
						/>
					</Button>
				</TooltipTrigger>
				<TooltipContent side="bottom">Good response</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Poor response"
						onClick={() => onRate(false)}
					>
						<ThumbsDownIcon
							className={
								rating === false ? "fill-current" : undefined
							}
						/>
					</Button>
				</TooltipTrigger>
				<TooltipContent side="bottom">Poor response</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Copy response"
						disabled={!textContent}
						onClick={handleCopy}
					>
						{copied ? <CheckIcon /> : <CopyIcon />}
					</Button>
				</TooltipTrigger>
				<TooltipContent side="bottom">Copy response</TooltipContent>
			</Tooltip>
			{onDownload && (
				<>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="Download response"
								disabled={!textContent}
								onClick={() => setIsDownloadOpen(true)}
							>
								<DownloadIcon />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							Download response
						</TooltipContent>
					</Tooltip>
					<Dialog
						open={isDownloadOpen}
						onOpenChange={setIsDownloadOpen}
					>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>Download Response</DialogTitle>
								<DialogDescription>
									Choose the format for your download:
								</DialogDescription>
							</DialogHeader>
							<div className="flex flex-col gap-2">
								{DOWNLOAD_FORMATS.map((format) => (
									<Button
										key={format.value}
										variant="outline"
										disabled={downloadingFormat !== null}
										onClick={() =>
											void handleDownload(format.value)
										}
									>
										{downloadingFormat === format.value ? (
											<Spinner />
										) : null}
										{format.label}
									</Button>
								))}
							</div>
						</DialogContent>
					</Dialog>
				</>
			)}
		</div>
	);
}
