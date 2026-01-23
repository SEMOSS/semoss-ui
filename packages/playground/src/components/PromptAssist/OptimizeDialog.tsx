import { CheckCircle2, Loader2, Sparkles, TrendingUp, Zap } from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect, useState } from "react";
import {
	Badge,
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { DiffViewer } from "./DiffViewer";
import type { PromptAssistStore } from "./PromptAssistStore";
import type { OptimizationResult } from "./types";

interface OptimizeDialogProps {
	original: string;
	open: boolean;
	onClose: () => void;
	onApply: (optimized: string) => void;
	promptAssistStore: PromptAssistStore;
}

export const OptimizeDialog = observer<OptimizeDialogProps>(
	({ original, open, onClose, onApply, promptAssistStore }) => {
		const [result, setResult] = useState<OptimizationResult | null>(null);
		const [loading, setLoading] = useState(false);

		useEffect(() => {
			if (open && original) {
				handleOptimize();
			}
		}, [open, original]);

		const handleOptimize = async () => {
			setLoading(true);
			try {
				const optimizationResult =
					await promptAssistStore.optimizePrompt(original);
				setResult(optimizationResult);
			} catch (error) {
				console.error("Optimization failed:", error);
			} finally {
				setLoading(false);
			}
		};

		const handleApply = () => {
			if (result) {
				promptAssistStore.addToHistory(original);
				onApply(result.optimized_prompt);
				onClose();
			}
		};

		return (
			<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
				<DialogContent
					className="flex max-h-[85vh] max-w-5xl flex-col overflow-hidden"
					data-testid="prompt-optimize-dialog"
				>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Sparkles className="h-5 w-5 text-purple-500" />
							AI-Powered Prompt Optimization
						</DialogTitle>
						<DialogDescription>
							Improve your prompt with AI-generated suggestions
							and best practices
						</DialogDescription>
					</DialogHeader>

					<div className="flex-1 overflow-y-auto">
						{loading ? (
							<div className="flex flex-col items-center justify-center gap-4 py-16">
								<Loader2 className="h-12 w-12 animate-spin text-purple-500" />
								<p className="text-muted-foreground text-sm">
									Analyzing and optimizing your prompt...
								</p>
							</div>
						) : result ? (
							<Tabs defaultValue="comparison" className="w-full">
								<TabsList className="grid w-full grid-cols-3">
									<TabsTrigger value="comparison">
										Comparison
									</TabsTrigger>
									<TabsTrigger value="improvements">
										Improvements (
										{result.improvements.length})
									</TabsTrigger>
									<TabsTrigger value="metrics">
										Metrics
									</TabsTrigger>
								</TabsList>

								{/* Comparison Tab */}
								<TabsContent
									value="comparison"
									className="mt-4"
								>
									<DiffViewer
										original={original}
										optimized={result.optimized_prompt}
									/>
								</TabsContent>

								{/* Improvements Tab */}
								<TabsContent
									value="improvements"
									className="mt-4 space-y-3"
								>
									{result.improvements.length > 0 ? (
										result.improvements.map(
											(improvement, idx) => (
												<div
													data-testid={`improvement-${idx}`}
													key={`improvement-${
														// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
														idx
													}`}
													className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
												>
													<CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
													<div className="min-w-0 flex-1">
														<div className="mb-1 flex items-center gap-2">
															<Badge
																variant={
																	improvement.impact ===
																	"high"
																		? "default"
																		: "secondary"
																}
																className="text-xs"
															>
																{
																	improvement.impact
																}{" "}
																impact
															</Badge>
														</div>
														<p className="text-sm leading-relaxed">
															{improvement.change}
														</p>
													</div>
												</div>
											),
										)
									) : (
										<div className="py-8 text-center text-muted-foreground">
											<p>
												Your prompt is already
												well-optimized!
											</p>
										</div>
									)}
								</TabsContent>

								{/* Metrics Tab */}
								<TabsContent value="metrics" className="mt-4">
									<div className="grid grid-cols-2 gap-4">
										<MetricCard
											icon={
												<TrendingUp className="h-5 w-5 text-green-500" />
											}
											label="Quality Improvement"
											value={`+${result.quality_improvement}%`}
											subtext={`${result.before_score} → ${result.after_score} points`}
											positive={
												result.quality_improvement > 0
											}
										/>
										<MetricCard
											icon={
												<Zap className="h-5 w-5 text-blue-500" />
											}
											label="Token Efficiency"
											value={
												result.token_savings >= 0
													? `-${result.token_savings}`
													: `+${Math.abs(result.token_savings)}`
											}
											subtext={`${result.token_savings >= 0 ? "Saved" : "Added"} tokens`}
											positive={result.token_savings >= 0}
										/>
										<MetricCard
											icon={
												<Sparkles className="h-5 w-5 text-purple-500" />
											}
											label="Original Quality"
											value={`${result.before_score}/100`}
											subtext={getQualityLabel(
												result.before_score,
											)}
										/>
										<MetricCard
											icon={
												<Sparkles className="h-5 w-5 text-purple-500" />
											}
											label="Optimized Quality"
											value={`${result.after_score}/100`}
											subtext={getQualityLabel(
												result.after_score,
											)}
										/>
									</div>
								</TabsContent>
							</Tabs>
						) : null}
					</div>

					<DialogFooter className="gap-2">
						<Button variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button
							onClick={handleApply}
							disabled={!result || loading}
							className="gap-2"
						>
							<Sparkles className="h-4 w-4" />
							Apply Optimization
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	},
);

interface MetricCardProps {
	icon: React.ReactNode;
	label: string;
	value: string | number;
	subtext?: string;
	positive?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
	icon,
	label,
	value,
	subtext,
	positive,
}) => (
	<div className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md">
		<div className="mb-3 flex items-center gap-3">
			<div className="rounded-lg bg-muted p-2">{icon}</div>
			<span className="font-medium text-muted-foreground text-sm">
				{label}
			</span>
		</div>
		<div
			className={cn(
				"mb-1 font-bold text-3xl",
				positive === true && "text-green-600",
				positive === false && "text-red-600",
			)}
		>
			{value}
		</div>
		{subtext && (
			<div className="text-muted-foreground text-xs">{subtext}</div>
		)}
	</div>
);

const getQualityLabel = (score: number): string => {
	if (score >= 90) return "Excellent";
	if (score >= 70) return "Good";
	if (score >= 50) return "Needs Improvement";
	return "Poor";
};
