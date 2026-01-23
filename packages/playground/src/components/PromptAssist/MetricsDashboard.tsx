import { Activity, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useState } from "react";
import {
	Badge,
	cn,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@semoss/ui/next";
import type { PromptAssistStore } from "./PromptAssistStore";

interface MetricsDashboardProps {
	store: PromptAssistStore;
	className?: string;
}

export const MetricsDashboard = observer<MetricsDashboardProps>(
	({ store, className }) => {
		const [open, setOpen] = useState(false);

		const getQualityColor = () => {
			if (store.qualityScore >= 80) return "bg-[rgba(34,197,94,1)]";
			if (store.qualityScore >= 60) return "bg-[rgba(234,179,8,1)]";
			return "bg-destructive";
		};

		const getQualityTextColor = () => {
			if (store.qualityScore >= 80) return "text-[rgba(21,128,61,1)]";
			if (store.qualityScore >= 60) return "text-[rgba(161,98,7,1)]";
			return "text-destructive";
		};

		const getQualityBgColor = () => {
			if (store.qualityScore >= 80)
				return "bg-[rgba(220,252,231,1)] border-[rgba(187,247,208,1)]";
			if (store.qualityScore >= 60)
				return "bg-[rgba(254,249,195,1)] border-[rgba(253,224,71,1)]";
			return "bg-[rgba(254,226,226,1)] border-[rgba(252,165,165,1)]";
		};

		if (!store.config.showQualityScore || store.qualityScore === 0) {
			return <div />;
		}

		return (
			<div className={cn("flex items-center justify-center", className)}>
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<button
							type="button"
							className={cn(
								"flex items-center gap-3 rounded-lg border px-4 py-2.5 transition-all hover:shadow-md",
								getQualityBgColor(),
							)}
							data-testid="metrics-dashboard-trigger"
						>
							{/* Quality Score Indicator */}
							<div className="flex items-center gap-2">
								<div
									className={cn(
										"h-2.5 w-2.5 rounded-full",
										getQualityColor(),
									)}
								/>
								<span
									className={cn(
										"font-semibold text-sm",
										getQualityTextColor(),
									)}
								>
									Quality: {store.qualityScore}/100
								</span>
							</div>

							{/* Issues Count */}
							{store.issues.length > 0 && (
								<div className="flex items-center gap-1.5">
									<AlertCircle className="h-4 w-4 text-muted-foreground" />
									<span className="text-muted-foreground text-sm">
										{store.issues.length}{" "}
										{store.issues.length === 1
											? "issue"
											: "issues"}
									</span>
								</div>
							)}

							{/* Token Count */}
							{store.tokenCount > 0 && (
								<div className="flex items-center gap-1.5">
									<Clock className="h-4 w-4 text-muted-foreground" />
									<span className="text-muted-foreground text-sm">
										{store.tokenCount} tokens
									</span>
								</div>
							)}
						</button>
					</PopoverTrigger>

					<PopoverContent className="w-96 p-0" align="center">
						<div className="space-y-4 p-6">
							{/* Header */}
							<div className="flex items-center gap-2 border-border border-b pb-3">
								<Activity className="h-5 w-5 text-primary" />
								<h3 className="font-semibold text-foreground text-sm">
									Prompt Analysis
								</h3>
							</div>

							{/* Metrics Grid */}
							<div className="grid grid-cols-2 gap-3">
								<MetricCard
									label="Quality Score"
									value={`${store.qualityScore}/100`}
									icon={
										store.qualityScore >= 80 ? (
											<CheckCircle2 className="h-4 w-4 text-[rgba(34,197,94,1)]" />
										) : (
											<AlertCircle className="h-4 w-4 text-[rgba(234,179,8,1)]" />
										)
									}
									status={store.qualityLevel}
								/>
								<MetricCard
									label="Issues Found"
									value={store.issues.length}
									breakdown={`${store.criticalIssueCount}C • ${store.mediumIssueCount}M • ${store.lowIssueCount}L`}
								/>
								<MetricCard
									label="Token Count"
									value={store.tokenCount}
									subtext="Current prompt"
								/>
								<MetricCard
									label="History"
									value={store.promptHistory.length}
									subtext="Saved versions"
								/>
							</div>

							{/* Issue Breakdown */}
							{store.issues.length > 0 && (
								<div className="space-y-2 border-border border-t pt-2">
									<h4 className="font-medium text-muted-foreground text-xs">
										Issue Breakdown
									</h4>
									<div className="flex flex-wrap gap-2">
										{store.criticalIssueCount > 0 && (
											<Badge
												variant="destructive"
												className="text-xs"
											>
												{store.criticalIssueCount}{" "}
												Critical
											</Badge>
										)}
										{store.mediumIssueCount > 0 && (
											<Badge
												variant="secondary"
												className="border-[rgba(253,224,71,1)] bg-[rgba(254,249,195,1)] text-[rgba(161,98,7,1)] text-xs"
											>
												{store.mediumIssueCount} Medium
											</Badge>
										)}
										{store.lowIssueCount > 0 && (
											<Badge
												variant="secondary"
												className="border-[rgba(147,197,253,1)] bg-[rgba(219,234,254,1)] text-[rgba(29,78,216,1)] text-xs"
											>
												{store.lowIssueCount} Low
											</Badge>
										)}
									</div>
								</div>
							)}
						</div>
					</PopoverContent>
				</Popover>
			</div>
		);
	},
);

interface MetricCardProps {
	label: string;
	value: string | number;
	icon?: React.ReactNode;
	status?: "excellent" | "good" | "needs_improvement" | "poor";
	breakdown?: string;
	subtext?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
	label,
	value,
	icon,
	status,
	breakdown,
	subtext,
}) => {
	const getStatusColor = () => {
		if (!status) return "text-foreground";
		switch (status) {
			case "excellent":
				return "text-[rgba(34,197,94,1)]";
			case "good":
				return "text-[rgba(59,130,246,1)]";
			case "needs_improvement":
				return "text-[rgba(234,179,8,1)]";
			case "poor":
				return "text-destructive";
		}
	};

	return (
		<div className="space-y-1.5 rounded-lg border border-border bg-card p-3">
			<div className="flex items-center justify-between">
				<div className="text-muted-foreground text-xs">{label}</div>
				{icon}
			</div>
			<div className={cn("font-bold text-xl", getStatusColor())}>
				{value}
			</div>
			{breakdown && (
				<div className="text-muted-foreground text-xs">{breakdown}</div>
			)}
			{subtext && (
				<div className="text-muted-foreground text-xs">{subtext}</div>
			)}
		</div>
	);
};
