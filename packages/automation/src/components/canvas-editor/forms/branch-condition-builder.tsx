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
	Small,
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
		<div className="flex flex-col gap-3">
			<div className="rounded-lg border bg-muted/30 px-3 py-2.5">
				<p className="font-medium text-sm">Choose which path runs</p>
				<p className="mt-0.5 text-muted-foreground text-xs">
					Paths are checked from top to bottom. The first match
					continues from its numbered output on the canvas.
				</p>
			</div>
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
			<div className="flex items-start gap-3 rounded-lg border border-dashed bg-muted/20 px-3 py-2.5">
				<span
					className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground text-xs"
					aria-hidden="true"
				>
					E
				</span>
				<div>
					<p className="font-medium text-sm">Else path</p>
					<p className="text-muted-foreground text-xs">
						Runs when none of the paths above match.
					</p>
				</div>
			</div>
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
					className="w-full"
				>
					<Plus className="size-4" aria-hidden="true" />
					Add Path
				</Button>
			)}
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
	const label = `Path ${index + 1}`;
	const updateParsed = (next: {
		value1: string;
		operator: BranchConditionOperator;
		value2: string;
	}) => onChange(generateBranchCondition(next));

	return (
		<div className="flex flex-col gap-3 rounded-lg border bg-card p-3">
			<div className="flex items-start justify-between gap-2">
				<div className="flex items-center gap-2">
					<span
						className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-xs"
						aria-hidden="true"
					>
						{index + 1}
					</span>
					<div>
						<p className="font-medium text-sm">{label}</p>
						<p className="text-muted-foreground text-xs">
							{index === 0
								? "Checked first"
								: "Checked after earlier paths"}
						</p>
					</div>
				</div>
				{!readOnly && (
					<div className="flex items-center gap-1">
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="size-7"
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
							className="size-7"
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
							className="size-7 text-muted-foreground hover:text-destructive"
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
						label="Value to check"
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
						<FieldLabel htmlFor={`${clause.id}-comparison`}>
							Comparison
						</FieldLabel>
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
								id={`${clause.id}-comparison`}
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
						label="Compare with"
						required
						value={parsed.value2}
						placeholder='"active"'
						onChange={(value2) =>
							updateParsed({ ...parsed, value2 })
						}
						upstreamVars={upstreamVars}
						readOnly={readOnly}
					/>
					<Small className="rounded-md bg-primary/5 px-2.5 py-2 text-xs">
						<span className="font-medium text-primary">
							When matched:
						</span>{" "}
						continue from <strong>{label}</strong> on the canvas.
					</Small>
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
