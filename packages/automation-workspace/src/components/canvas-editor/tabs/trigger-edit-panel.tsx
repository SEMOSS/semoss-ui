import { Lock, Play, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button, Field, FieldLabel, Input, Textarea } from "@semoss/ui/next";
import type { AutomationNode } from "../../../domain/automation.types";
import type { AutomationGlobalVariable } from "../../../domain/automation-workflow.types";

/** Props for the trigger inspector panel. */
interface TriggerEditPanelProps {
	description: string;
	onDescriptionChange: (value: string) => void;
	onClose: () => void;
	step: AutomationNode;
	onUpdate: (step: AutomationNode) => void;
	/** When true, renders the trigger's configuration as view-only. */
	readOnly?: boolean;
}

interface GlobalInputRow {
	id: string;
	value: AutomationGlobalVariable;
}

function createGlobalInputRow(value: AutomationGlobalVariable): GlobalInputRow {
	return { id: crypto.randomUUID(), value };
}

export function TriggerEditPanel({
	description,
	onDescriptionChange,
	onClose,
	step,
	onUpdate,
	readOnly = false,
}: TriggerEditPanelProps) {
	const [globalRows, setGlobalRows] = useState<GlobalInputRow[]>(() => {
		const globals = Array.isArray(step.workflowConfig?.globals)
			? (step.workflowConfig.globals as AutomationGlobalVariable[])
			: [];
		return globals.map(createGlobalInputRow);
	});
	const updateGlobals = (nextRows: GlobalInputRow[]) => {
		if (readOnly) return;
		setGlobalRows(nextRows);
		onUpdate({
			...step,
			workflowConfig: {
				...step.workflowConfig,
				globals: nextRows.map((row) => row.value),
			},
		});
	};

	return (
		<div className="flex h-full flex-col bg-background">
			<div className="flex items-center justify-between border-b px-4 py-3">
				<div className="flex items-center gap-2">
					<span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15">
						<Play className="h-3.5 w-3.5 text-emerald-600" />
					</span>
					<span className="font-semibold text-sm">Trigger</span>
					{readOnly && (
						<span className="flex items-center gap-1 rounded-md border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
							<Lock className="size-3" />
							View only
						</span>
					)}
				</div>
				<Button
					size="sm"
					variant="ghost"
					className="h-8 w-8 p-0"
					onClick={onClose}
					aria-label="Close"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>
			<div className="flex-1 overflow-y-auto px-4 py-4">
				<div className="space-y-4">
					<Field>
						<FieldLabel className="text-xs">Description</FieldLabel>
						<Textarea
							className="resize-none text-sm"
							rows={3}
							value={description}
							onChange={(event) => {
								if (readOnly) return;
								onDescriptionChange(event.target.value);
							}}
							placeholder="I want to monitor new files and notify my team"
							readOnly={readOnly}
						/>
					</Field>
					<div className="space-y-3 rounded-lg border p-3">
						<div>
							<p className="font-medium text-sm">Global inputs</p>
							<p className="text-[11px] text-muted-foreground">
								Inputs provided when this automation is started,
								using the defaults below when none are given.
							</p>
						</div>
						{globalRows.map((row) => (
							<div
								key={row.id}
								className="grid grid-cols-[1fr_1fr_auto] gap-2"
							>
								<Input
									value={row.value.name}
									placeholder="variable_name"
									readOnly={readOnly}
									onChange={(event) =>
										updateGlobals(
											globalRows.map((item) =>
												item.id === row.id
													? {
															...item,
															value: {
																...item.value,
																name: event
																	.target
																	.value,
															},
														}
													: item,
											),
										)
									}
								/>
								<Input
									value={row.value.defaultValue}
									placeholder="Default value"
									readOnly={readOnly}
									onChange={(event) =>
										updateGlobals(
											globalRows.map((item) =>
												item.id === row.id
													? {
															...item,
															value: {
																...item.value,
																defaultValue:
																	event.target
																		.value,
															},
														}
													: item,
											),
										)
									}
								/>
								{!readOnly && (
									<Button
										size="sm"
										variant="ghost"
										aria-label={`Remove ${row.value.name || "global input"}`}
										onClick={() =>
											updateGlobals(
												globalRows.filter(
													(item) =>
														item.id !== row.id,
												),
											)
										}
									>
										<Trash2 className="size-4" />
									</Button>
								)}
							</div>
						))}
						{!readOnly && (
							<Button
								size="sm"
								variant="outline"
								className="self-start"
								onClick={() =>
									updateGlobals([
										...globalRows,
										createGlobalInputRow({
											name: "",
											defaultValue: "",
										}),
									])
								}
							>
								<Plus className="mr-1.5 size-4" />
								Add input
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
