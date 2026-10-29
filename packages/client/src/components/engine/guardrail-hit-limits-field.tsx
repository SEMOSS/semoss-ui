import { ChevronRight, Plus } from "lucide-react";
import { useId, useState } from "react";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	Muted,
	useFieldArray,
	useFormContext,
} from "@semoss/ui/next";
import type {
	GuardrailConfigFormValue,
	GuardrailConfigIssue,
} from "./engine-guardrail-settings.constants";
import {
	createGuardrailHitLimit,
	type GuardrailHitLimitCheck,
	type GuardrailHitLimitFormValue,
} from "./guardrail-hit-limit";
import { GuardrailHitLimitField } from "./guardrail-hit-limit-field";

export interface GuardrailHitLimitsFieldProps {
	/** The limits, as the form holds them now */
	value: GuardrailHitLimitFormValue[];

	/** The checks a limit can count */
	checks: GuardrailHitLimitCheck[];

	/** Problems with the limits, to show, each on its limit */
	issues: GuardrailConfigIssue[];

	/** Whether the limits accept edits */
	disabled?: boolean;

	/** Prefix for the limits' element ids */
	idPrefix: string;

	/** Prefix for the limits' test ids */
	testIdPrefix: string;
}

/**
 * An engine's hit limits: how many hits of which checks close the room, or
 * lock the user out of the engine. A hit is any check flagging a call, whether
 * it blocks, masks or answers. The limits start folded away under a count of
 * them, with Add Limit under the last one, and open when a save attempt finds a
 * problem in one; folded with problems, the count says so.
 */
export const GuardrailHitLimitsField = ({
	value,
	checks,
	issues,
	disabled,
	idPrefix,
	testIdPrefix,
}: GuardrailHitLimitsFieldProps) => {
	const headingId = useId();
	const { control } = useFormContext<GuardrailConfigFormValue>();
	const limits = useFieldArray({
		control,
		name: "hitLimits",
		keyName: "fieldArrayId",
	});
	const [isOpen, setIsOpen] = useState(false);
	const [shownIssueCount, setShownIssueCount] = useState(issues.length);
	if (issues.length !== shownIssueCount) {
		setShownIssueCount(issues.length);
		if (issues.length > shownIssueCount) {
			setIsOpen(true);
		}
	}

	return (
		<Collapsible asChild open={isOpen} onOpenChange={setIsOpen}>
			<section
				className="space-y-4"
				aria-labelledby={headingId}
				data-testid={testIdPrefix}
			>
				<div className="space-y-1">
					<h3 id={headingId} className="font-medium text-sm">
						<CollapsibleTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="-ml-2"
								data-testid={`${testIdPrefix}-toggle`}
							>
								<ChevronRight
									aria-hidden
									className={cn(
										"transition-transform",
										isOpen && "rotate-90",
									)}
								/>
								Hit Limits
								<span className="font-normal text-muted-foreground">
									{value.length === 0
										? "None"
										: `${value.length} ${value.length === 1 ? "limit" : "limits"}`}
								</span>
								{issues.length > 0 && (
									<span className="font-normal text-destructive">
										Needs changes
									</span>
								)}
							</Button>
						</CollapsibleTrigger>
					</h3>
					<Muted>
						Close the room, or lock the user out of this engine,
						once its checks flag enough calls. A hit is any check
						flagging a call, whether it blocks, masks or answers.
					</Muted>
				</div>

				<CollapsibleContent className="space-y-4">
					{value.length === 0 ? (
						<p className="rounded-md border border-dashed p-4 text-center text-muted-foreground text-xs">
							No hit limits. Each check acts on the call it flags,
							and nothing more.
						</p>
					) : (
						<div className="space-y-4">
							{value.map((limit, index) => (
								<GuardrailHitLimitField
									key={limit.id}
									value={limit}
									index={index}
									checks={checks}
									issues={issues.filter(
										(issue) => issue.limitId === limit.id,
									)}
									onRemove={() => limits.remove(index)}
									disabled={disabled}
									idPrefix={`${idPrefix}-${index}`}
									testIdPrefix={`${testIdPrefix}-${index}`}
									namePrefix={`hitLimits.${index}`}
								/>
							))}
						</div>
					)}
					{!disabled && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() =>
								limits.append(
									createGuardrailHitLimit([], value),
									{
										shouldFocus: false,
									},
								)
							}
							data-testid={`${testIdPrefix}-add`}
						>
							<Plus className="size-4" aria-hidden />
							Add Limit
						</Button>
					)}
				</CollapsibleContent>
			</section>
		</Collapsible>
	);
};
