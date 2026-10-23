import { ChevronRight, Plus } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	FieldDescription,
	FieldLegend,
	FieldSet,
	Muted,
	useFieldArray,
	useFormContext,
} from "@semoss/ui/next";
import { RULE_COLUMN_CLASSES, SqlPolicyRuleRow } from "./sql-policy-rule-row";
import {
	type PolicyField,
	type PolicyFormValues,
	type PolicyRule,
	summarizeRules,
	toRemovedBuiltIns,
} from "./sql-query-policy";

/** Props for {@link SqlPolicyRulesField}. */
export interface SqlPolicyRulesFieldProps {
	/** The policy's list of rules in the form. */
	name: PolicyField;
	/** What the policy controls, as its heading. */
	label: string;
	/** What a rule matches in this policy, with an example. */
	description: ReactNode;
	/** Whether a rule names an operation from the list, or a name or pattern typed in. */
	matchKind: "operation" | "name";
	/** An example name or pattern, shown in a rule's empty name. */
	placeholder?: string;
	/**
	 * The guardrail's built-in rules for this policy and the chosen dialect. The
	 * list starts with them; one that is removed can be added back.
	 */
	builtIns?: readonly PolicyRule[];
	/** Whether the rules are locked, as they are while the form saves. */
	disabled?: boolean;
	/**
	 * Whether the rules are shown. With {@link onOpenChange}, the label folds
	 * the rules away and shows how many there are; without, they always show.
	 */
	open?: boolean;
	/** Called when the label is selected to show or fold away the rules. */
	onOpenChange?: (open: boolean) => void;
}

/**
 * One SQL query policy as a list of rules, each what it applies to and the
 * access it requires, added and removed in place. The guardrail's built-in
 * rules are listed with a fixed name and an access that can be changed; one
 * that is removed shows below the list, to add back. Removing a rule moves
 * focus to the rule that takes its place, or to Add rule. Given {@link
 * SqlPolicyRulesFieldProps.onOpenChange}, the rules fold away under the label.
 * Problems show once the form is submitted.
 */
export const SqlPolicyRulesField = ({
	name,
	label,
	description,
	matchKind,
	placeholder,
	builtIns = [],
	disabled = false,
	open = true,
	onOpenChange,
}: SqlPolicyRulesFieldProps) => {
	const { control, formState, setFocus, watch } =
		useFormContext<PolicyFormValues>();
	const { fields, append, remove } = useFieldArray({ control, name });
	const descriptionId = useId();
	const addRuleRef = useRef<HTMLButtonElement>(null);
	// the place of a rule just removed, whose neighbor gets focus once it is gone
	const [removedIndex, setRemovedIndex] = useState<number | null>(null);
	const rules = watch(name) ?? [];
	const removedBuiltIns = toRemovedBuiltIns(rules, builtIns);
	const hasProblems = !!formState.errors[name];
	const appliesTo =
		matchKind === "operation" ? "Operation" : "Name or pattern";

	useEffect(() => {
		if (removedIndex === null) {
			return;
		}
		if (fields.length === 0) {
			addRuleRef.current?.focus();
		} else {
			setFocus(
				`${name}.${Math.min(removedIndex, fields.length - 1)}.requirement`,
			);
		}
		setRemovedIndex(null);
	}, [removedIndex, fields.length, name, setFocus]);

	const handleRemove = (index: number) => {
		remove(index);
		setRemovedIndex(index);
	};

	return (
		<Collapsible asChild open={open} onOpenChange={onOpenChange}>
			<FieldSet aria-describedby={descriptionId}>
				<FieldLegend variant="label">
					{onOpenChange ? (
						<CollapsibleTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="-ml-2"
							>
								<ChevronRight
									aria-hidden
									className={cn(
										"transition-transform",
										open && "rotate-90",
									)}
								/>
								{label}
								<span className="font-normal text-muted-foreground">
									{summarizeRules(
										fields.length,
										removedBuiltIns.length,
									)}
								</span>
								{hasProblems && (
									<span className="font-normal text-destructive">
										Needs changes
									</span>
								)}
							</Button>
						</CollapsibleTrigger>
					) : (
						label
					)}
				</FieldLegend>
				<FieldDescription id={descriptionId}>
					{description}
				</FieldDescription>
				<CollapsibleContent className="flex flex-col gap-6">
					{fields.length === 0 ? (
						<Muted className="text-sm">No rules yet.</Muted>
					) : (
						<div className="flex flex-col gap-4 sm:gap-2">
							<div
								aria-hidden
								className={cn(
									"hidden gap-2 text-muted-foreground text-xs",
									RULE_COLUMN_CLASSES,
								)}
							>
								<span>{appliesTo}</span>
								<span>Access</span>
								<span />
							</div>
							{fields.map((rule, index) => (
								<SqlPolicyRuleRow
									key={rule.id}
									name={name}
									index={index}
									label={label}
									matchKind={matchKind}
									isBuiltIn={rule.builtIn === true}
									placeholder={placeholder}
									disabled={disabled}
									onRemove={() => handleRemove(index)}
								/>
							))}
						</div>
					)}
					{removedBuiltIns.length > 0 && (
						<div className="flex flex-col gap-2">
							<Muted className="text-xs">
								Removed built-in rules, which this guardrail
								will not apply. Select one to add it back.
							</Muted>
							<div className="flex flex-wrap gap-2">
								{removedBuiltIns.map((builtIn) => (
									<Button
										key={builtIn.key}
										type="button"
										variant="outline"
										size="sm"
										onClick={() =>
											append({
												...builtIn,
												builtIn: true,
											})
										}
										disabled={disabled}
										aria-label={`Add back the built-in ${label.toLowerCase()} rule for ${builtIn.key}`}
									>
										<Plus aria-hidden />
										<code className="font-mono text-xs">
											{builtIn.key}
										</code>
									</Button>
								))}
								{removedBuiltIns.length > 1 && (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() =>
											append(
												removedBuiltIns.map(
													(builtIn) => ({
														...builtIn,
														builtIn: true,
													}),
												),
											)
										}
										disabled={disabled}
									>
										Add all back
									</Button>
								)}
							</div>
						</div>
					)}
					<div>
						<Button
							ref={addRuleRef}
							type="button"
							variant="outline"
							size="sm"
							onClick={() =>
								append({ key: "", requirement: "DENY" })
							}
							disabled={disabled}
						>
							<Plus aria-hidden />
							Add rule
						</Button>
					</div>
				</CollapsibleContent>
			</FieldSet>
		</Collapsible>
	);
};
