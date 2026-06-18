import { ChevronDown } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { cn, Spinner } from "@semoss/ui/next";
import type { ToolStore } from "@/stores";

const formatStreamingArguments = (buffer: string): string => {
	if (!buffer) return "";
	try {
		return JSON.stringify(JSON.parse(buffer), null, 2);
	} catch {
		// mid-stream: JSON isn't valid yet, show the raw accumulated string
		return buffer;
	}
};

interface ResponseMessageToolStreamingProps {
	tool: ToolStore;
}

/**
 * Placeholder pill rendered while a tool call is still streaming in. We have
 * the wire id and (eventually) the wire name and partial JSON arguments — but
 * not the friendly title, description, or `_meta` (those arrive in the final
 * sync, at which point the parent swaps this component for the real pill).
 *
 * Clicking the pill expands an inline preview of the accumulating JSON.
 */
export const ResponseMessageToolStreaming: React.FC<ResponseMessageToolStreamingProps> =
	observer(({ tool }) => {
		const { t } = useTranslation("tool");
		const [isOpen, setIsOpen] = useState(false);

		return (
			<div className="flex flex-col rounded-lg border border-border bg-background hover:bg-accent">
				<div className="flex items-center">
					<button
						type="button"
						className="flex min-w-0 flex-1 items-center gap-3 p-2 text-start"
						onClick={() => setIsOpen((prev) => !prev)}
					>
						<div className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground">
							<Spinner />
						</div>
						<div className="flex min-w-0 flex-1 flex-col">
							<span className="truncate font-medium text-foreground text-sm">
								{t("status.loadingTool")}
							</span>
						</div>
						<ChevronDown
							className={cn(
								"size-4 shrink-0 text-muted-foreground transition-transform",
								isOpen && "rotate-180",
							)}
						/>
					</button>
				</div>

				{isOpen && (
					<div className="border-border border-t p-2">
						<pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded bg-muted p-2 font-mono text-muted-foreground text-xs">
							{formatStreamingArguments(tool.argumentsBuffer) || (
								<span className="italic">
									{t("status.waitingForArguments")}
								</span>
							)}
						</pre>
					</div>
				)}
			</div>
		);
	});
