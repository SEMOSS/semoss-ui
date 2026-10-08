import { TriangleAlert } from "lucide-react";
import { useId } from "react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Field,
	FieldLabel,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import {
	BRANCH_CONDITION_OPERATORS,
	type BranchConditionOperator,
	generateBranchCondition,
	parseBranchCondition,
} from "../../../domain/branch-condition";
import { PillInput } from "./pill-input";

export interface ConditionExpressionFormProps {
	condition: string;
	onChange: (condition: string) => void;
	upstreamVars: string[];
	devMode: boolean;
	readOnly?: boolean;
}

/** Edits one bounded Automation condition in business or developer form. */
export function ConditionExpressionForm({
	condition,
	onChange,
	upstreamVars,
	devMode,
	readOnly = false,
}: ConditionExpressionFormProps) {
	const comparisonId = useId();
	const parsed = parseBranchCondition(condition);
	const updateParsed = (next: {
		value1: string;
		operator: BranchConditionOperator;
		value2: string;
	}) => onChange(generateBranchCondition(next));

	if (devMode) {
		return (
			<PillInput
				label="Continue while"
				required
				value={condition}
				placeholder='${status} != "complete"'
				onChange={onChange}
				upstreamVars={upstreamVars}
				readOnly={readOnly}
			/>
		);
	}

	if (!parsed) {
		return (
			<div className="flex flex-col gap-3">
				<Alert className="border-warning/40 bg-warning/10 text-warning">
					<TriangleAlert className="size-4" aria-hidden="true" />
					<AlertTitle>This condition needs Developer mode</AlertTitle>
					<AlertDescription className="text-warning/90">
						The condition uses advanced logic that the simple
						builder cannot edit without changing it.
					</AlertDescription>
				</Alert>
				<PillInput
					label="Continue while"
					value={condition}
					onChange={() => {}}
					upstreamVars={upstreamVars}
					readOnly
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			<PillInput
				label="Value to check"
				required
				value={parsed.value1}
				placeholder="${status}"
				onChange={(value1) => updateParsed({ ...parsed, value1 })}
				upstreamVars={upstreamVars}
				readOnly={readOnly}
			/>
			<Field>
				<FieldLabel htmlFor={comparisonId}>Comparison</FieldLabel>
				<Select
					value={parsed.operator}
					onValueChange={(operator) =>
						updateParsed({
							...parsed,
							operator: operator as BranchConditionOperator,
						})
					}
					disabled={readOnly}
				>
					<SelectTrigger id={comparisonId} className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{BRANCH_CONDITION_OPERATORS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</Field>
			<PillInput
				label="Compare with"
				required
				value={parsed.value2}
				placeholder="complete"
				onChange={(value2) => updateParsed({ ...parsed, value2 })}
				upstreamVars={upstreamVars}
				readOnly={readOnly}
			/>
		</div>
	);
}
