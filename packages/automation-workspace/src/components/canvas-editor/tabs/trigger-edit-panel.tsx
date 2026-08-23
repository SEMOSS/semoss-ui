import { Play, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import {
	Button,
	Field,
	FieldLabel,
	Input,
	Switch,
	Textarea,
} from "@semoss/ui/next";
import type { AutomationNode } from "../../../domain/automation.types";
import type { AutomationGlobalVariable } from "../../../domain/automation-workflow.types";

/** Props for the trigger inspector panel. */
interface TriggerEditPanelProps {
	description: string;
	devMode: boolean;
	onDescriptionChange: (value: string) => void;
	onDevModeChange: (value: boolean) => void;
	onClose: () => void;
	step: AutomationNode;
	onUpdate: (step: AutomationNode) => void;
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
	devMode,
	onDescriptionChange,
	onDevModeChange,
	onClose,
	step,
	onUpdate,
}: TriggerEditPanelProps) {
	const [globalRows, setGlobalRows] = useState<GlobalInputRow[]>(() => {
		const globals = Array.isArray(step.workflowConfig?.globals)
			? (step.workflowConfig.globals as AutomationGlobalVariable[])
			: [];
		return globals.map(createGlobalInputRow);
	});
	const updateGlobals = (nextRows: GlobalInputRow[]) => {
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
							onChange={(event) =>
								onDescriptionChange(event.target.value)
							}
							placeholder="// I want to monitor new files and notify my team"
						/>
					</Field>
					<div className="space-y-3 rounded-lg border p-3">
						<div>
							<p className="font-medium text-sm">Global inputs</p>
							<p className="text-[11px] text-muted-foreground">
								Default values are available to every step and
								are the inputs Playground asks for.
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
								<Button
									size="sm"
									variant="ghost"
									aria-label={`Remove ${row.value.name || "global input"}`}
									onClick={() =>
										updateGlobals(
											globalRows.filter(
												(item) => item.id !== row.id,
											),
										)
									}
								>
									<Trash2 className="size-4" />
								</Button>
							</div>
						))}
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
					</div>
					<div className="flex items-center justify-between rounded-lg border px-3 py-2">
						<div>
							<p className="font-medium text-sm">Dev Mode</p>
							<p className="text-[11px] text-muted-foreground">
								Show Python source editors on executable nodes.
							</p>
						</div>
						<Switch
							checked={devMode}
							onCheckedChange={onDevModeChange}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
