import { Loader2, MessageSquare } from "lucide-react";
import type React from "react";
import type { RunStatus } from "../../domain/automation.types";

interface RunBannerProps {
	status: RunStatus;
	aiSummary: string | null;
	generatingAiSummary: boolean;
	onDismiss: () => void;
	containerRef?: React.Ref<HTMLDivElement>;
	/** Shown as an "Ask Assistant to help" action, only on the failed-run banner. */
	onAskAssistant?: () => void;
}

export function RunBanner({
	status,
	aiSummary,
	generatingAiSummary,
	onDismiss,
	containerRef,
	onAskAssistant,
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
			className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-xs ${
				isSuccess
					? "border-success/40 bg-success/10"
					: "border-destructive/30 bg-destructive/5"
			}`}
		>
			<div className="flex flex-1 items-start gap-2">
				{generatingAiSummary && !aiSummary && (
					<Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
				)}
				<span
					className={`font-medium ${isSuccess ? "text-success" : "text-destructive"}`}
				>
					{summaryText}
				</span>
			</div>
			<div className="ml-3 flex shrink-0 items-center gap-3">
				{!isSuccess && onAskAssistant && (
					<button
						type="button"
						onClick={onAskAssistant}
						className="flex items-center gap-1 rounded-md border border-destructive/30 bg-background px-2 py-1 font-medium text-destructive transition-colors hover:bg-destructive/10"
					>
						<MessageSquare className="h-3 w-3" aria-hidden />
						Ask Assistant to help
					</button>
				)}
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
