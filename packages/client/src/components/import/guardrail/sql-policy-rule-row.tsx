import { Trash2 } from "lucide-react";
import { useId } from "react";
import {
	Badge,
	Button,
	cn,
	FieldError,
	FormField,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	useFormContext,
} from "@semoss/ui/next";
import { SqlOperationSelect } from "./sql-operation-select";
import {
	type PolicyField,
	type PolicyFormValues,
	REQUIREMENT_OPTIONS,
} from "./sql-query-policy";

/**
 * The columns of a rule's row from sm up: what it applies to, its access, and
 * remove. The list's column headings use the same columns.
 */
export const RULE_COLUMN_CLASSES =
	"sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_2rem] sm:items-start";

/** Props for {@link SqlPolicyRuleRow}. */
export interface SqlPolicyRuleRowProps {
	/** The policy's list of rules in the form. */
	name: PolicyField;
	/** The rule's place in the list. */
	index: number;
	/** What the policy controls, which the row's controls are named after. */
	label: string;
	/** Whether the rule names an operation from the list, or a name or pattern typed in. */
	matchKind: "operation" | "name";
	/** Whether this is one of the guardrail's built-in rules, whose name is fixed. */
	isBuiltIn: boolean;
	/** An example name or pattern, shown in the rule's empty name. */
	placeholder?: string;
	/** Whether the rule is locked, as it is while the form saves. */
	disabled?: boolean;
	/** Called when the rule's remove button is pressed. */
	onRemove: () => void;
}

/**
 * One rule of a SQL query policy: what it applies to, the access it requires,
 * and a button that removes it. A built-in rule shows its name, fixed; any
 * other takes an operation from the list or a name or pattern. On a narrow
 * screen the controls stack. Problems show once the form is submitted.
 */
export const SqlPolicyRuleRow = ({
	name,
	index,
	label,
	matchKind,
	isBuiltIn,
	placeholder,
	disabled = false,
	onRemove,
}: SqlPolicyRuleRowProps) => {
	const { control, watch } = useFormContext<PolicyFormValues>();
	const errorId = useId();
	const ruleKey = (watch(`${name}.${index}.key`) ?? "").trim();
	const appliesTo =
		matchKind === "operation" ? "operation" : "name or pattern";
	const ruleName = ruleKey ? `the ${ruleKey} rule` : `rule ${index + 1}`;

	return (
		<div className={cn("flex flex-col gap-2", RULE_COLUMN_CLASSES)}>
			<FormField
				control={control}
				name={`${name}.${index}.key`}
				render={({ field, fieldState }) => {
					const controlProps = {
						"aria-label": `${label}, ${ruleName}: ${appliesTo}`,
						"aria-invalid": !!fieldState.error,
						"aria-describedby": fieldState.error
							? errorId
							: undefined,
					};
					return (
						<div className="flex min-w-0 flex-col gap-1">
							{isBuiltIn ? (
								<div className="flex min-h-9 min-w-0 flex-wrap items-center gap-2">
									<code className="break-all font-mono text-sm">
										{field.value}
									</code>
									<Badge variant="secondary">Built-in</Badge>
								</div>
							) : matchKind === "operation" ? (
								<SqlOperationSelect
									{...controlProps}
									ref={field.ref}
									value={field.value}
									onValueChange={field.onChange}
									onBlur={field.onBlur}
									disabled={disabled}
								/>
							) : (
								<Input
									{...field}
									{...controlProps}
									placeholder={placeholder}
									spellCheck={false}
									autoComplete="off"
									disabled={disabled}
								/>
							)}
							{fieldState.error?.message && (
								<FieldError id={errorId}>
									{fieldState.error.message}
								</FieldError>
							)}
						</div>
					);
				}}
			/>
			<FormField
				control={control}
				name={`${name}.${index}.requirement`}
				render={({ field }) => (
					<Select
						value={field.value}
						onValueChange={field.onChange}
						disabled={disabled}
					>
						<SelectTrigger
							ref={field.ref}
							onBlur={field.onBlur}
							aria-label={`${label}, ${ruleName}: access`}
							className="w-full"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{REQUIREMENT_OPTIONS.map((option) => (
								<SelectItem
									key={option.value}
									value={option.value}
								>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
			/>
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				className="self-end sm:self-auto"
				onClick={onRemove}
				disabled={disabled}
				aria-label={`Remove ${ruleName} from ${label.toLowerCase()}`}
			>
				<Trash2 aria-hidden />
			</Button>
		</div>
	);
};
