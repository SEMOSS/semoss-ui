import { AlertCircle, RefreshCw, Settings2 } from "lucide-react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Badge,
	Button,
	Card,
	CardContent,
	P,
	Separator,
	Spinner,
} from "@semoss/ui/next";
import {
	type GuardrailConfig,
	GuardrailConfigEditor,
} from "@/components/shared";
import {
	GuardrailMethodConfigCard,
	type MethodGuardrailConfig,
} from "./guardrail-method-config-card";

export type EngineMethod = {
	methodName: string;
	deprecated: boolean;
};

export type MethodConfigMap = Record<string, MethodGuardrailConfig>;

export type Phase =
	| "idle"
	| "loading"
	| "selecting"
	| "submitting"
	| "configured";

interface GuardrailSelectingViewProps {
	phase: Phase;
	engineMethods: EngineMethod[];
	guardrails: unknown[];
	methodConfigs: MethodConfigMap;
	expandedMethods: Set<string>;
	configuredCount: number;
	hasAnyConfig: boolean;
	submitError: string | null;
	appliedMethods: string[];
	configResult: GuardrailConfig | null;
	onSubmit: () => void;
	onCancel: () => void;
	onReset: () => void;
	onToggleMethod: (name: string) => void;
	onUpdateMethod: (method: string, config: MethodGuardrailConfig) => void;
	onDeleteMethod: (method: string) => void;
	onSave: (data: GuardrailConfig) => Promise<void>;
}

export const GuardrailSelectingView = ({
	phase,
	engineMethods,
	guardrails,
	methodConfigs,
	expandedMethods,
	configuredCount,
	hasAnyConfig,
	submitError,
	appliedMethods,
	configResult,
	onSubmit,
	onCancel,
	onReset,
	onToggleMethod,
	onUpdateMethod,
	onDeleteMethod,
	onSave,
}: GuardrailSelectingViewProps) => {
	// Configured phase
	if (phase === "configured" && configResult) {
		return (
			<div className="space-y-4">
				<Alert className="border-chart-2/20 bg-chart-2/5 text-chart-2 [&>svg]:text-chart-2">
					<AlertTitle>Guardrail configured successfully</AlertTitle>
					<AlertDescription>
						<div className="flex flex-wrap gap-1.5 pt-1">
							{appliedMethods.map((name) => (
								<Badge
									key={name}
									variant="outline"
									className="rounded-full border-chart-2/30 bg-chart-2/10 px-2.5 py-0.5 text-[11px] text-chart-2"
								>
									{name}
								</Badge>
							))}
						</div>
					</AlertDescription>
				</Alert>

				<div className="space-y-2">
					<div className="flex items-center gap-2 px-0.5">
						<Separator className="flex-1" />
						<span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
							Pipeline Configuration
						</span>
						<Separator className="flex-1" />
					</div>
					<GuardrailConfigEditor
						initialData={configResult}
						onSave={onSave}
					/>
				</div>
			</div>
		);
	}

	// Selecting/loading phases
	return (
		<div className="space-y-4">
			{phase === "loading" ? (
				<div className="flex flex-col items-center gap-3 py-14">
					<Spinner className="size-6" />
					<P className="text-muted-foreground text-sm">
						Loading engine methods and guardrails...
					</P>
				</div>
			) : (
				<>
					{/* Instruction banner */}
					<div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
						<div className="min-w-0 flex-1 space-y-0.5">
							<P className="font-medium text-foreground text-sm">
								Assign guardrails to engine methods
							</P>
							<P className="text-muted-foreground text-xs">
								For each method, choose guardrail engines to
								intercept the{" "}
								<span className="font-medium text-primary">
									input
								</span>{" "}
								and{" "}
								<span className="font-medium text-chart-2">
									output
								</span>
								. Delete any methods you don't need to guard.
							</P>
						</div>
						{configuredCount > 0 && (
							<Badge
								color="info"
								className="ml-auto shrink-0 px-2 py-0.5 text-xs"
							>
								{configuredCount} / {engineMethods.length}{" "}
								configured
							</Badge>
						)}
					</div>

					{/* Method cards */}
					{engineMethods.length === 0 ? (
						<Card className="border-dashed">
							<CardContent className="flex flex-col items-center justify-center gap-2 py-10">
								<P className="text-muted-foreground text-sm">
									All methods have been removed.
								</P>
								<Button
									variant="outline"
									size="sm"
									onClick={onReset}
									className="flex items-center gap-1.5"
								>
									<RefreshCw size={13} />
									Reset methods
								</Button>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-2">
							{engineMethods.map((method) => (
								<GuardrailMethodConfigCard
									key={method.methodName}
									methodName={method.methodName}
									deprecated={method.deprecated}
									config={
										methodConfigs[method.methodName] ?? {
											input: [],
											output: [],
										}
									}
									guardrails={guardrails}
									isGuardrailsLoading={false}
									isExpanded={expandedMethods.has(
										method.methodName,
									)}
									onToggle={() =>
										onToggleMethod(method.methodName)
									}
									onUpdate={(cfg) =>
										onUpdateMethod(method.methodName, cfg)
									}
									onDelete={() =>
										onDeleteMethod(method.methodName)
									}
								/>
							))}
						</div>
					)}

					{/* Action row */}
					<div className="flex flex-wrap items-center gap-3 pt-1">
						<Button
							color="primary"
							disabled={
								!hasAnyConfig ||
								phase === "submitting" ||
								engineMethods.length === 0
							}
							onClick={onSubmit}
							className="flex items-center gap-2"
						>
							{phase === "submitting" ? (
								<>
									<div className="size-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
									Applying...
								</>
							) : (
								<>
									<Settings2 size={14} />
									Apply Configuration
								</>
							)}
						</Button>
						<Button
							variant="ghost"
							onClick={onCancel}
							disabled={phase === "submitting"}
						>
							Cancel
						</Button>
					</div>

					{submitError && (
						<Alert variant="destructive">
							<AlertCircle />
							<AlertDescription>{submitError}</AlertDescription>
						</Alert>
					)}
				</>
			)}
		</div>
	);
};
