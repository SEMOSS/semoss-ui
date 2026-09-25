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
		<div className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
			<span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-primary">
				<FileText aria-hidden="true" className="size-4" />
			</span>
			<span className="min-w-0">
				<span className="wrap-anywhere block font-medium text-sm">
					{fileName}
				</span>
				{mimeType && (
					<Muted className="wrap-anywhere block text-xs">
						{mimeType}
					</Muted>
				)}
			</span>
		</div>
	);
}
