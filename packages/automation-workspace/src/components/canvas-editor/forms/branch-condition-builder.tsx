import {
	ChevronDown,
	ChevronUp,
	Plus,
	Trash2,
	TriangleAlert,
} from "lucide-react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Field,
	FieldLabel,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import type { AutomationBranchClause } from "../../../domain/automation-workflow.types";
import {
	BRANCH_CONDITION_OPERATORS,
	type BranchConditionOperator,
	generateBranchCondition,
	parseBranchCondition,
} from "../../../domain/branch-condition";
import { PillInput } from "./pill-input";

export interface BranchConditionBuilderProps {
	/** Ordered conditional routes evaluated before the final Else path. */
	clauses: AutomationBranchClause[];
	onChange: (clauses: AutomationBranchClause[]) => void;
	/** Upstream variable names available for insertion into Value 1 / Value 2. */
	upstreamVars: string[];
	/** Dev mode always shows the raw expression editor; Design mode prefers the builder. */
	devMode: boolean;
	readOnly?: boolean;
}

/**
 * Business/Design-mode "Value 1 + Operator + Value 2" builder for a branch step's condition,
 * backed by the same persisted condition expression used everywhere else. Falls back to a
 * read-only view of the raw expression (with a warning) when the condition can't be losslessly
 * represented by the simple builder, so it's never silently rewritten. Dev mode always shows the
 * raw, freely editable expression instead.
 */
export function BranchConditionBuilder({
	clauses,
	onChange,
	upstreamVars,
	devMode,
	readOnly = false,
}: BranchConditionBuilderProps) {
	return (
		<div className="flex flex-col gap-4">
			{clauses.map((clause, index) => (
				<BranchClauseEditor
					key={clause.id}
					clause={clause}
					index={index}
					clauseCount={clauses.length}
					onChange={(condition) =>
						onChange(
							clauses.map((item) =>
								item.id === clause.id
									? { ...item, condition }
									: item,
							),
						)
					}
					onMove={(direction) => {
						const destination = index + direction;
						if (destination < 0 || destination >= clauses.length)
							return;
						const next = [...clauses];
						[next[index], next[destination]] = [
							next[destination],
							next[index],
						];
						onChange(next);
					}}
					onRemove={() =>
						onChange(
							clauses.filter((item) => item.id !== clause.id),
						)
					}
					upstreamVars={upstreamVars}
					devMode={devMode}
					readOnly={readOnly}
				/>
			))}
			{!readOnly && (
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() =>
						onChange([
							...clauses,
							{ id: crypto.randomUUID(), condition: "" },
						])
					}
				>
					<Plus className="size-4" aria-hidden="true" />
					Add Condition
				</Button>
			)}
			<p className="text-muted-foreground text-xs">
				Conditions run in order. The first match runs its path;
				otherwise <strong>Path {clauses.length + 1}</strong> runs.
			</p>
		</div>
	);
}

function BranchClauseEditor({
	clause,
	index,
	clauseCount,
	onChange,
	onMove,
	onRemove,
	upstreamVars,
	devMode,
	readOnly,
}: {
	clause: AutomationBranchClause;
	index: number;
	clauseCount: number;
	onChange: (condition: string) => void;
	onMove: (direction: -1 | 1) => void;
	onRemove: () => void;
	upstreamVars: string[];
	devMode: boolean;
	readOnly: boolean;
}) {
	const parsed = parseBranchCondition(clause.condition);
	const label = `Condition ${index + 1}`;
	const updateParsed = (next: {
		value1: string;
		operator: BranchConditionOperator;
		value2: string;
	}) => onChange(generateBranchCondition(next));

	return (
		<div className="flex flex-col gap-3 border-border border-b pb-4 last:border-b-0">
			<div className="flex items-center justify-between gap-2">
				<p className="font-medium text-sm">{label}</p>
				{!readOnly && (
					<div className="flex items-center gap-1">
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={() => onMove(-1)}
							disabled={index === 0}
							aria-label={`Move ${label} up`}
						>
							<ChevronUp className="size-4" aria-hidden="true" />
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={() => onMove(1)}
							disabled={index === clauseCount - 1}
							aria-label={`Move ${label} down`}
						>
							<ChevronDown
								className="size-4"
								aria-hidden="true"
							/>
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={onRemove}
							disabled={clauseCount === 1}
							aria-label={`Remove ${label}`}
						>
							<Trash2 className="size-4" aria-hidden="true" />
						</Button>
					</div>
				)}
			</div>
			{devMode ? (
				<PillInput
					label={`${label} condition`}
					required
					value={clause.condition}
					placeholder='${database_query_1} == "active"'
					onChange={onChange}
					upstreamVars={upstreamVars}
					readOnly={readOnly}
				/>
			) : parsed ? (
				<>
					<PillInput
						label="Value 1"
						required
						value={parsed.value1}
						placeholder="${database_query_1}"
						onChange={(value1) =>
							updateParsed({ ...parsed, value1 })
						}
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
									operator:
										operator as BranchConditionOperator,
								})
							}
							disabled={readOnly}
						>
							<SelectTrigger
								className="w-full"
								aria-label={`${label} operator`}
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{BRANCH_CONDITION_OPERATORS.map((option) => (
									<SelectItem
										key={option.value}
										value={option.value}
									>
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
						onChange={(value2) =>
							updateParsed({ ...parsed, value2 })
						}
						upstreamVars={upstreamVars}
						readOnly={readOnly}
					/>
				</>
			) : (
				<>
					<Alert className="border-warning/40 bg-warning/10 text-warning">
						<TriangleAlert className="size-4" />
						<AlertTitle>
							This condition needs Developer mode
						</AlertTitle>
						<AlertDescription className="text-warning/90">
							This condition is set up in a way the simple builder
							can't show, so it's read-only here. Switch to
							Developer mode to edit it directly.
						</AlertDescription>
					</Alert>
					<PillInput
						label={`${label} condition`}
						value={clause.condition}
						upstreamVars={upstreamVars}
						onChange={() => {}}
						readOnly
					/>
				</>
			)}
		</div>
	);
}
