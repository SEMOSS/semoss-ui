import { Activity, Settings, Sparkles, Zap } from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import {
	Badge,
	Button,
	cn,
	Label,
	Separator,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
	Switch,
} from "@semoss/ui/next";
import type { PromptAssistStore } from "./PromptAssistStore";

interface SettingsPanelProps {
	store: PromptAssistStore;
}

export const SettingsPanel = observer<SettingsPanelProps>(({ store }) => {
	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					data-testid="prompt-assist-settings-trigger"
				>
					<Settings className="h-4 w-4" />
				</Button>
			</SheetTrigger>
			<SheetContent className="w-[400px] overflow-y-auto p-6 sm:w-[450px]">
				<SheetHeader className="space-y-3 p-0">
					<SheetTitle className="flex items-center gap-2 text-foreground">
						<Sparkles className="h-5 w-5 text-primary" />
						PromptAssist Settings
					</SheetTitle>
					<SheetDescription className="text-muted-foreground text-sm leading-relaxed">
						Configure how PromptAssist analyzes and optimizes your
						prompts
					</SheetDescription>
				</SheetHeader>

				<div className="space-y-8 py-4">
					{/* Enable/Disable */}
					<div className="flex items-start justify-between gap-6">
						<div className="flex-1 space-y-2">
							<Label
								htmlFor="enabled"
								className="font-semibold text-foreground text-sm"
							>
								Enable PromptAssist
							</Label>
							<p className="text-muted-foreground text-xs leading-relaxed">
								Real-time prompt analysis and suggestions
							</p>
						</div>
						{/** biome-ignore lint/correctness/useUniqueElementIds: <explanation> */}
						<Switch
							id="enabled"
							checked={store.config.enabled}
							onCheckedChange={(checked) =>
								store.setEnabled(checked)
							}
							data-testid="prompt-assist-enable-toggle"
						/>
					</div>

					<Separator className="my-6 bg-border" />

					{/* Auto-analyze */}
					<div className="flex items-start justify-between gap-6">
						<div className="flex-1 space-y-2">
							<Label
								htmlFor="auto-analyze"
								className="font-semibold text-foreground text-sm"
							>
								Auto-analyze
							</Label>
							<p className="text-muted-foreground text-xs leading-relaxed">
								Analyze prompts automatically as you type
							</p>
						</div>
						{/** biome-ignore lint/correctness/useUniqueElementIds: <explanation> */}
						<Switch
							id="auto-analyze"
							checked={store.config.autoAnalyze}
							onCheckedChange={() => store.toggleAutoAnalyze()}
							disabled={!store.config.enabled}
						/>
					</div>

					{/* Show Quality Score */}
					<div className="flex items-start justify-between gap-6">
						<div className="flex-1 space-y-2">
							<Label
								htmlFor="show-quality"
								className="font-semibold text-foreground text-sm"
							>
								Show Quality Score
							</Label>
							<p className="text-muted-foreground text-xs leading-relaxed">
								Display real-time quality metrics
							</p>
						</div>
						{/** biome-ignore lint/correctness/useUniqueElementIds: <explanation> */}
						<Switch
							id="show-quality"
							checked={store.config.showQualityScore}
							onCheckedChange={(checked) =>
								store.setConfig({ showQualityScore: checked })
							}
							disabled={!store.config.enabled}
						/>
					</div>

					<Separator className="my-6 bg-border" />

					{/* LLM-powered analysis */}
					<div className="flex items-start justify-between gap-6">
						<div className="flex-1 space-y-2">
							<Label
								htmlFor="use-llm"
								className="flex items-center gap-2 font-semibold text-foreground text-sm"
							>
								<Zap className="h-4 w-4 text-[rgba(234,179,8,1)]" />
								AI-Powered Analysis
								<Badge
									variant="secondary"
									className="bg-secondary text-secondary-foreground text-xs"
								>
									Beta
								</Badge>
							</Label>
							<p className="text-muted-foreground text-xs leading-relaxed">
								Use GPT-4 for deeper analysis (slower but more
								accurate)
							</p>
						</div>
						{/** biome-ignore lint/correctness/useUniqueElementIds: <explanation> */}
						<Switch
							id="use-llm"
							checked={store.config.useLLM}
							onCheckedChange={() => store.toggleLLM()}
							disabled={!store.config.enabled}
						/>
					</div>

					<Separator className="my-6 bg-border" />

					{/* Statistics */}
					<div className="space-y-5">
						<div className="flex items-center gap-2">
							<Activity className="h-4 w-4 text-muted-foreground" />
							<h4 className="font-semibold text-foreground text-sm">
								Current Session
							</h4>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<StatCard
								label="Quality Score"
								value={`${store.qualityScore}/100`}
								status={store.qualityLevel}
							/>
							<StatCard
								label="Active Issues"
								value={store.issues.length}
								breakdown={`${store.criticalIssueCount}C • ${store.mediumIssueCount}M • ${store.lowIssueCount}L`}
							/>
							<StatCard
								label="Token Count"
								value={store.tokenCount}
								subtext="Current prompt"
							/>
							<StatCard
								label="History"
								value={store.promptHistory.length}
								subtext="Saved versions"
							/>
						</div>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
});

interface StatCardProps {
	label: string;
	value: string | number;
	status?: "excellent" | "good" | "needs_improvement" | "poor";
	breakdown?: string;
	subtext?: string;
}

const StatCard: React.FC<StatCardProps> = ({
	label,
	value,
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
		<div className="space-y-2.5 rounded-lg border border-border bg-card p-4">
			<div className="font-medium text-muted-foreground text-xs">
				{label}
			</div>
			<div className={cn("font-bold text-2xl", getStatusColor())}>
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
