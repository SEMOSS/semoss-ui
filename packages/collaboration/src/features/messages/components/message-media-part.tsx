import { FileText } from "lucide-react";
import { useContext } from "react";
import { cn, Muted } from "@semoss/ui/next";
import { ToolWorkbenchContext } from "@/features/tools/tool-workbench.context";

const CARD_CLASS =
	"flex items-start gap-3 rounded-xl border border-border/50 bg-muted/20 p-3";

/** Compact file attachment inside a persisted message; opens in the dock when one is available. */
export function MessageMediaPart({
	fileName,
	fileLocation,
	mimeType,
}: {
	fileName: string;
	/** Path in the room folder; present once the message is saved. */
	fileLocation?: string;
	mimeType?: string;
}) {
	const workbench = useContext(ToolWorkbenchContext);
	const content = (
		<>
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
		</>
	);
	if (!workbench || !fileLocation)
		return <div className={CARD_CLASS}>{content}</div>;
	return (
		<button
			type="button"
			className={cn(
				CARD_CLASS,
				"w-full text-left hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring",
			)}
			aria-label={`Open ${fileName}`}
			onClick={() => workbench.openFile(fileLocation, fileName)}
		>
			{content}
		</button>
	);
}
