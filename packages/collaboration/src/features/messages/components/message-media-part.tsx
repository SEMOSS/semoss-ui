import { FileText } from "lucide-react";
import { Muted } from "@semoss/ui/next";

/** Compact file attachment inside a persisted message. */
export function MessageMediaPart({
	fileName,
	mimeType,
}: {
	fileName: string;
	mimeType?: string;
}) {
	return (
		<div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2">
			<span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-primary">
				<FileText aria-hidden="true" className="size-4" />
			</span>
			<span className="min-w-0">
				<span className="block truncate font-medium text-xs">
					{fileName}
				</span>
				{mimeType && (
					<Muted className="block truncate text-xs">{mimeType}</Muted>
				)}
			</span>
		</div>
	);
}
