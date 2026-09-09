import { PaperclipIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface ModelChatAttachmentStripProps {
	/** Files queued on the composer, in the order they were added. */
	files: File[];

	/** Called with the file's position when the user removes it. */
	onRemove: (index: number) => void;

	/** Disables the remove buttons while a turn is in flight. */
	disabled: boolean;
}

/**
 * Strip of queued attachments above the composer textarea: images render as
 * thumbnails, everything else as a paperclip chip. Renders nothing when the
 * queue is empty.
 *
 * @name ModelChatAttachmentStrip
 * @param files - Files queued on the composer.
 * @param onRemove - Called with the file's position when the user removes it.
 * @param disabled - Disables the remove buttons while a turn is in flight.
 * @return The attachment strip, or null when empty.
 */
export const ModelChatAttachmentStrip = ({
	files,
	onRemove,
	disabled,
}: ModelChatAttachmentStripProps) => {
	// Object URLs are revoked together whenever the queue changes: they are
	// only ever read by the thumbnails below, so there is nothing left holding
	// a stale one after a re-render.
	const [previews, setPreviews] = useState<(string | undefined)[]>([]);

	useEffect(() => {
		const urls = files.map((file) =>
			file.type.startsWith("image/")
				? URL.createObjectURL(file)
				: undefined,
		);
		setPreviews(urls);

		return () => {
			for (const url of urls) {
				if (url) URL.revokeObjectURL(url);
			}
		};
	}, [files]);

	if (files.length === 0) return null;

	return (
		<div
			className="flex flex-wrap items-center gap-2 px-3 pt-3"
			data-testid="model-chat-composer-attachments"
		>
			{files.map((file, index) => {
				const preview = previews[index];
				return preview ? (
					<div
						key={`${file.name}-${file.lastModified}`}
						className="group relative size-12 shrink-0 overflow-hidden rounded-md border border-border"
						title={file.name}
					>
						<img
							src={preview}
							alt={file.name}
							className="h-full w-full object-cover"
						/>
						<button
							type="button"
							disabled={disabled}
							onClick={() => onRemove(index)}
							aria-label={`Remove ${file.name}`}
							className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full border border-border bg-background text-foreground opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
						>
							<XIcon className="size-3" />
						</button>
					</div>
				) : (
					<span
						key={`${file.name}-${file.lastModified}`}
						className="inline-flex max-w-48 items-center gap-1 rounded-sm border border-border bg-background/70 px-2 py-1 text-xs"
						title={file.name}
					>
						<PaperclipIcon className="size-3 shrink-0" />
						<span className="min-w-0 truncate">{file.name}</span>
						<button
							type="button"
							disabled={disabled}
							onClick={() => onRemove(index)}
							aria-label={`Remove ${file.name}`}
							className="shrink-0 text-muted-foreground hover:text-foreground"
						>
							<XIcon className="size-3" />
						</button>
					</span>
				);
			})}
		</div>
	);
};
