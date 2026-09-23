import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@semoss/ui/next";
import type { GuardrailConfigIssue } from "./engine-guardrail-settings.constants";

export interface GuardrailIssueListProps {
	/** Problems found in the current editor value. */
	issues: GuardrailConfigIssue[];

	/** Reveals an issue's rule and check when its message is selected. */
	onSelect: (issue: GuardrailConfigIssue) => void;
}

interface GuardrailIssueGroupProps {
	issues: GuardrailConfigIssue[];
	/** Summary shown above the list when there is more than one issue. */
	heading: string;
	destructive: boolean;
	testId: string;
	onSelect: (issue: GuardrailConfigIssue) => void;
}

/** One message, made selectable when it can point at a rule. */
const GuardrailIssueMessage = ({
	issue,
	onSelect,
}: {
	issue: GuardrailConfigIssue;
	onSelect: (issue: GuardrailConfigIssue) => void;
}) =>
	issue.pipelineId ? (
		<button
			type="button"
			onClick={() => onSelect(issue)}
			className="cursor-pointer text-left underline decoration-dotted underline-offset-2 hover:decoration-solid"
		>
			{issue.message}
		</button>
	) : (
		<span>{issue.message}</span>
	);

/**
 * A single issue reads as one line; several are summarized and listed, so the
 * summary stays proportional to what is wrong instead of taking a fixed block
 * of the panel.
 */
const GuardrailIssueGroup = ({
	issues,
	heading,
	destructive,
	testId,
	onSelect,
}: GuardrailIssueGroupProps) => {
	const Icon = destructive ? AlertTriangle : Info;

	return (
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
			<div className="min-w-0 flex-1">
				{issues.length === 1 && issues[0] ? (
					<GuardrailIssueMessage
						issue={issues[0]}
						onSelect={onSelect}
					/>
				) : (
					<>
						<p className="font-medium">{heading}</p>
						<ul className="mt-1 space-y-0.5">
							{issues.map((issue, index) => (
								<li
									// issues are derived per render and carry no
									// id, so the rule and position identify the row
									key={`${issue.pipelineId ?? "config"}-${index}`}
									className="flex gap-2"
								>
									<span aria-hidden>-</span>
									<GuardrailIssueMessage
										issue={issue}
										onSelect={onSelect}
									/>
								</li>
							))}
						</ul>
					</>
				)}
			</div>
		</div>
	);
};

/**
 * Lists every problem in the configuration at once so a save attempt does not
 * have to be repeated per error, and each message navigates to the rule and
 * check it came from.
 */
export const GuardrailIssueList = ({
	issues,
	onSelect,
}: GuardrailIssueListProps) => {
	const errors = issues.filter((issue) => issue.severity === "error");
	const warnings = issues.filter((issue) => issue.severity === "warning");

	if (errors.length === 0 && warnings.length === 0) {
		return null;
	}

	return (
		<div className="space-y-2">
			{errors.length > 0 && (
				<GuardrailIssueGroup
					issues={errors}
					heading={`${errors.length} problems block saving`}
					destructive
					testId="engine-guardrail-settings--errors"
					onSelect={onSelect}
				/>
			)}
			{warnings.length > 0 && (
				<GuardrailIssueGroup
					issues={warnings}
					heading={`${warnings.length} things to check`}
					destructive={false}
					testId="engine-guardrail-settings--warnings"
					onSelect={onSelect}
				/>
			)}
		</div>
	);
};
