import { Loader2 } from "lucide-react";
import type React from "react";
import type { RunStatus } from "../../domain/automation.types";

interface RunBannerProps {
	status: RunStatus;
	aiSummary: string | null;
	generatingAiSummary: boolean;
	onDismiss: () => void;
	containerRef?: React.Ref<HTMLDivElement>;
}

export function RunBanner({
	status,
	aiSummary,
	generatingAiSummary,
	onDismiss,
	containerRef,
}: RunBannerProps) {
	const isSuccess = status === "SUCCESS";

	const summaryText =
		generatingAiSummary && !aiSummary
			? "Summarizing run…"
			: (aiSummary ??
				(isSuccess ? "Run completed successfully." : "Run failed."));

	return (
		<div
			ref={containerRef}
			className={`flex items-start justify-between rounded-lg border px-3 py-2 text-xs ${
				isSuccess
					? "border-emerald-300/50 bg-emerald-50 dark:bg-emerald-900/20"
					: "border-destructive/30 bg-destructive/5"
			}`}
		>
			<div className="flex flex-1 items-start gap-2">
				{generatingAiSummary && !aiSummary && (
					<Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
				)}
				<span
					className={`font-medium ${isSuccess ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"}`}
				>
					{summaryText}
				</span>
			</div>
			<div className="ml-3 flex shrink-0 items-center gap-3">
				<button
					type="button"
					onClick={onDismiss}
					className="text-muted-foreground hover:text-foreground"
					aria-label="Dismiss"
				>
					✕
				</button>
			</div>
		</div>
	);
}
