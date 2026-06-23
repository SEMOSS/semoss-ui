import { ArrowDown, ArrowUp, ChevronDown, ChevronUp } from "lucide-react";
import { memo } from "react";
import { Badge, Button, Card } from "@semoss/ui/next";
import { GuardrailSelectorPanel } from "./guardrail-selector-panel";

export type MethodGuardrailConfig = {
	input: string[];
	output: string[];
};

interface GuardrailMethodConfigCardProps {
	methodName: string;
	deprecated: boolean;
	config: MethodGuardrailConfig;
	guardrails: unknown[];
	isGuardrailsLoading: boolean;
	isExpanded: boolean;
	onToggle: () => void;
	onUpdate: (config: MethodGuardrailConfig) => void;
}

export const GuardrailMethodConfigCard = memo<GuardrailMethodConfigCardProps>(
	({
		methodName,
		deprecated,
		config,
		guardrails,
		isGuardrailsLoading,
		isExpanded,
		onToggle,
		onUpdate,
	}) => {
		const inCount = config.input.length;
		const outCount = config.output.length;
		const isConfigured = inCount > 0 || outCount > 0;

		return (
			<Card className="w-full gap-0 overflow-hidden rounded-lg py-0 transition-all">
				<div
					className={`flex w-full items-center justify-between px-4 py-3 transition-colors ${
						isExpanded
							? "rounded-t-lg bg-secondary"
							: "rounded-lg bg-secondary"
					}`}
				>
					<button
						type="button"
						onClick={onToggle}
						className="flex flex-1 items-center gap-3 text-left"
					>
						<span className="font-semibold text-foreground text-sm">
							{methodName}
						</span>
						{deprecated && (
							<Badge
								variant="outline"
								className="rounded-full border-chart-5/30 bg-chart-5/10 px-2 py-0.5 text-[10px] text-chart-5"
							>
								Deprecated
							</Badge>
						)}
					</button>

					<div className="flex items-center gap-2">
						{isConfigured ? (
							<div className="flex items-center gap-1.5">
								{inCount > 0 && (
									<Badge
										variant="outline"
										className="gap-0.5 rounded-full border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] text-primary [&>svg]:size-2.5"
									>
										<ArrowDown />
										{inCount}
									</Badge>
								)}
								{outCount > 0 && (
									<Badge
										variant="outline"
										className="gap-0.5 rounded-full border-chart-2/20 bg-chart-2/10 px-2 py-0.5 text-[10px] text-chart-2 [&>svg]:size-2.5"
									>
										<ArrowUp />
										{outCount}
									</Badge>
								)}
							</div>
						) : (
							<span className="text-muted-foreground text-xs">
								Not configured
							</span>
						)}

						<Button
							variant="ghost"
							size="icon-sm"
							onClick={onToggle}
							className="text-muted-foreground"
						>
							{isExpanded ? <ChevronUp /> : <ChevronDown />}
						</Button>
					</div>
				</div>

				{isExpanded && (
					<div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
						<GuardrailSelectorPanel
							direction="input"
							guardrails={guardrails}
							selected={config.input}
							onChange={(ids) =>
								onUpdate({ ...config, input: ids })
							}
							isLoading={isGuardrailsLoading}
						/>
						<GuardrailSelectorPanel
							direction="output"
							guardrails={guardrails}
							selected={config.output}
							onChange={(ids) =>
								onUpdate({ ...config, output: ids })
							}
							isLoading={isGuardrailsLoading}
						/>
					</div>
				)}
			</Card>
		);
	},
);
GuardrailMethodConfigCard.displayName = "GuardrailMethodConfigCard";
