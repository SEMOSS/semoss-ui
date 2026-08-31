import { TriangleAlert } from "lucide-react";
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

export interface BranchConditionBuilderProps {
	/** The persisted, raw condition string (`BranchConfig.condition`). */
	condition: string;
	onChange: (condition: string) => void;
	/** Upstream variable names available for insertion into Value 1 / Value 2. */
	upstreamVars: string[];
	/** Dev mode always shows the raw expression editor; Design mode prefers the builder. */
	devMode: boolean;
	readOnly?: boolean;
}

/**
 * Business/Design-mode "Value 1 + Operator + Value 2" builder for a branch step's condition,
 * backed by the same persisted Python condition string used everywhere else. Falls back to a
 * read-only view of the raw expression (with a warning) when the condition can't be losslessly
 * represented by the simple builder, so it's never silently rewritten. Dev mode always shows the
 * raw, freely editable expression instead.
 */
export function BranchConditionBuilder({
	condition,
	onChange,
	upstreamVars,
	devMode,
	readOnly = false,
}: BranchConditionBuilderProps) {
	if (devMode) {
		return (
			<div className="flex flex-col gap-4">
				<PillInput
					label="Condition"
					required
					value={condition}
					placeholder='${database_query_1} == "active"'
					onChange={onChange}
					upstreamVars={upstreamVars}
					readOnly={readOnly}
				/>
				<p className="text-muted-foreground text-xs">
					A Python expression that evaluates to True or False. When
					True the <strong>Then</strong> path runs, otherwise the{" "}
					<strong>Else</strong> path runs.
				</p>
			</div>
		);
	}

	const parsed = parseBranchCondition(condition);

	if (!parsed) {
		return (
			<div className="flex flex-col gap-3">
				<Alert className="border-warning/40 bg-warning/10 text-warning">
					<TriangleAlert className="size-4" />
					<AlertTitle>This condition needs Developer mode</AlertTitle>
					<AlertDescription className="text-warning/90">
						This condition is set up in a way the simple builder
						can't show, so it's read-only here. Switch to Developer
						mode to edit it directly.
					</AlertDescription>
				</Alert>
				<PillInput
					label="Condition"
					value={condition}
					upstreamVars={upstreamVars}
					onChange={() => {
						/* read-only in Design mode when the condition can't be parsed */
					}}
					readOnly
				/>
			</div>
		);
	}

	const updateParsed = (next: {
		value1: string;
		operator: BranchConditionOperator;
		value2: string;
	}) => {
		if (readOnly) return;
		onChange(generateBranchCondition(next));
	};

	return (
		<div className="flex flex-col gap-4">
			<PillInput
				label="Value 1"
				required
				value={parsed.value1}
				placeholder="${database_query_1}"
				onChange={(value1) => updateParsed({ ...parsed, value1 })}
				upstreamVars={upstreamVars}
				readOnly={readOnly}
			/>
			<Field>
				<FieldLabel>Operator</FieldLabel>
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
					<SelectTrigger className="w-full" aria-label="Operator">
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
				label="Value 2"
				required
				value={parsed.value2}
				placeholder='"active"'
				onChange={(value2) => updateParsed({ ...parsed, value2 })}
				upstreamVars={upstreamVars}
				readOnly={readOnly}
			/>
			<p className="text-muted-foreground text-xs">
				When this comparison is true the <strong>Then</strong> path
				runs, otherwise the <strong>Else</strong> path runs.
			</p>
		</div>
	);
}
