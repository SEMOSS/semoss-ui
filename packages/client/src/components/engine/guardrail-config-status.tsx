import { AlertTriangle, ChevronsUpDown, Copy, ShieldOff } from "lucide-react";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	toast,
} from "@semoss/ui/next";
import type { GuardrailFileStatus } from "./engine-guardrail-settings.constants";

export interface GuardrailConfigStatusProps {
	/** State of the stored pipeline file, as reported by the backend. */
	status: GuardrailFileStatus;

	/** Number of rules currently held in the editor. */
	ruleCount: number;

	/** Whether the current user can save the configuration. */
	isEditable: boolean;
}

interface GuardrailNoticeProps extends React.PropsWithChildren {
	icon: React.ComponentType<{ className?: string }>;
	destructive?: boolean;
	testId: string;
}

/** One compact status line. Built from plain layout so the notice stays a
 * single row of text next to its icon. */
const GuardrailNotice = ({
	icon: Icon,
	destructive,
	testId,
	children,
}: GuardrailNoticeProps) => (
	<div
		className={cn(
			"flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
			destructive
				? "border-destructive/40 bg-destructive/5 text-destructive"
				: "border-border bg-muted/40 text-foreground",
		)}
		data-testid={testId}
	>
		<Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
		<div className="min-w-0 flex-1">{children}</div>
	</div>
);

const copyToClipboard = async (content: string) => {
	try {
		await navigator.clipboard.writeText(content);
		toast.success("Copied the stored configuration");
	} catch {
		toast.error("Unable to copy the stored configuration");
	}
};

/**
 * Reports whether the engine actually loads a guardrail file. A rule set that
 * looks complete in the editor still screens nothing while the engine has no
 * pipeline file, so that state is called out rather than left to be inferred.
 */
export const GuardrailConfigStatus = ({
	status,
	ruleCount,
	isEditable,
}: GuardrailConfigStatusProps) => {
	const savingHint = isEditable
		? "Saving writes the file and points the engine at it."
		: "An engine editor has to save the configuration to enable it.";

	return (
		<div className="space-y-2">
			{status.state === "not-enabled" && (
				<GuardrailNotice
					icon={ShieldOff}
					testId="engine-guardrail-settings--not-enabled"
				>
					<span className="font-medium">
						Guardrails are not enabled yet.
					</span>{" "}
					This engine has no pipeline file, so every request and
					response reaches the model unchecked. {savingHint}
				</GuardrailNotice>
			)}

			{status.state === "file-missing" && (
				<GuardrailNotice
					icon={AlertTriangle}
					testId="engine-guardrail-settings--file-missing"
				>
					<span className="font-medium">
						The configured pipeline file does not exist.
					</span>{" "}
					The engine points at{" "}
					<span className="font-mono">{status.pipelineFileName}</span>
					, which has not been created, so nothing is screened yet.{" "}
					{savingHint}
				</GuardrailNotice>
			)}

			{status.state === "loaded" &&
				ruleCount === 0 &&
				!status.parseError && (
					<GuardrailNotice
						icon={ShieldOff}
						testId="engine-guardrail-settings--no-rules"
					>
						<span className="font-medium">
							No rules are configured.
						</span>{" "}
						Guardrails are enabled for this engine but no rule is
						defined, so every call passes unchecked.
					</GuardrailNotice>
				)}

			{status.parseError && (
				<GuardrailNotice
					icon={AlertTriangle}
					destructive
					testId="engine-guardrail-settings--parse-error"
				>
					<p>
						<span className="font-medium">
							The stored configuration could not be read:
						</span>{" "}
						{status.parseError}
					</p>
					<p className="mt-1">
						The editor starts empty because of this. Saving replaces
						the stored file with whatever is configured here, so
						copy anything worth keeping first.
					</p>
					{status.rawContent !== null && (
						<Collapsible className="mt-2">
							<div className="flex flex-wrap items-center gap-2">
								<CollapsibleTrigger asChild>
									<Button
										type="button"
										variant="outline"
										size="sm"
										data-testid="engine-guardrail-settings--raw-content-toggle"
									>
										<ChevronsUpDown
											className="size-4"
											aria-hidden
										/>
										View the stored file
									</Button>
								</CollapsibleTrigger>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() =>
										copyToClipboard(status.rawContent ?? "")
									}
								>
									<Copy className="size-4" aria-hidden />
									Copy
								</Button>
							</div>
							<CollapsibleContent>
								<pre
									className="mt-2 max-h-64 select-text overflow-auto rounded-md bg-muted p-3 font-mono text-foreground text-xs"
									data-testid="engine-guardrail-settings--raw-content"
								>
									{status.rawContent}
								</pre>
							</CollapsibleContent>
						</Collapsible>
					)}
				</GuardrailNotice>
			)}
		</div>
	);
};
