import { FileIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button, Muted, Small } from "@semoss/ui/next";

export interface FilePreviewTileProps {
	/** Visible name of the pending attachment. */
	name: string;
	/** File size or source description. */
	detail?: string;
	/** Optional image preview. */
	previewUrl?: string;
	/** Source icon for an attachment added by a connector. */
	badge?: ReactNode;
	/** Accessible name for the persistent remove button. */
	removeLabel: string;
	/** Removes the attachment from the next message. */
	onRemove: () => void;
}

/** Shared chip presentation for uploads and files queued by connector viewers. */
export function FilePreviewTile({
	name,
	detail,
	previewUrl,
	badge,
	removeLabel,
	onRemove,
}: FilePreviewTileProps) {
	return (
		<div className="flex max-w-full items-center gap-2 rounded-xl border bg-background p-2">
			{previewUrl ? (
				<img
					src={previewUrl}
					alt=""
					className="size-9 shrink-0 rounded-md object-cover"
				/>
			) : (
				<FileIcon
					aria-hidden="true"
					className="size-5 shrink-0 text-muted-foreground"
				/>
			)}
			<div className="min-w-0 flex-1">
				<Small className="max-w-48 break-words font-medium text-xs">
					{name}
				</Small>
				{detail && <Muted className="text-xs">{detail}</Muted>}
			</div>
			{badge && (
				<span className="shrink-0 text-muted-foreground">{badge}</span>
			)}
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				aria-label={removeLabel}
				onClick={onRemove}
			>
				<XIcon aria-hidden="true" />
			</Button>
		</div>
	);
}
