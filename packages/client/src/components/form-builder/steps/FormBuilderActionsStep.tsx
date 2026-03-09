import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Checkbox,
	Separator,
} from "@semoss/ui/next";
import type { CrudOperation, FormBuilderState } from "../form-builder.types";

const OPERATIONS: {
	value: CrudOperation;
	label: string;
	description: string;
}[] = [
	{
		value: "create",
		label: "Create",
		description: "Add new records via a form",
	},
	{
		value: "read",
		label: "Read",
		description: "View and search records in a data table",
	},
	{
		value: "update",
		label: "Update",
		description: "Edit existing records via a form",
	},
	{
		value: "delete",
		label: "Delete",
		description: "Remove records with confirmation",
	},
];

interface FormBuilderActionsStepProps {
	state: FormBuilderState;
	onUpdate: (updates: Partial<FormBuilderState>) => void;
}

export const FormBuilderActionsStep = ({
	state,
	onUpdate,
}: FormBuilderActionsStepProps) => {
	const toggleOperation = (tableIdx: number, op: CrudOperation) => {
		const newTables = [...state.tables];
		const table = { ...newTables[tableIdx] };
		if (table.operations.includes(op)) {
			table.operations = table.operations.filter((o) => o !== op);
		} else {
			table.operations = [...table.operations, op];
		}
		newTables[tableIdx] = table;
		onUpdate({ tables: newTables });
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Choose CRUD Actions</CardTitle>
				<CardDescription>
					For each table, select which operations the app should
					support. Each enabled operation generates a separate page.
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-6">
				{state.tables.map((table, tableIdx) => (
					<div key={table.table} className="flex flex-col gap-3">
						{tableIdx > 0 && <Separator />}
						<div className="flex flex-col gap-1">
							<span className="font-semibold text-base">
								{table.table}
							</span>
							<span className="text-muted-foreground text-xs">
								{table.columns.length} columns
							</span>
						</div>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							{OPERATIONS.map((op) => (
								// biome-ignore lint/a11y/noLabelWithoutControl: Checkbox is nested inside label
								<label
									key={op.value}
									className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
										table.operations.includes(op.value)
											? "border-primary bg-primary/5"
											: "border-border hover:bg-accent"
									}`}
								>
									<Checkbox
										checked={table.operations.includes(
											op.value,
										)}
										onCheckedChange={() =>
											toggleOperation(tableIdx, op.value)
										}
										className="mt-0.5"
									/>
									<div className="flex flex-col gap-0.5">
										<span className="font-medium text-sm">
											{op.label}
										</span>
										<span className="text-muted-foreground text-xs">
											{op.description}
										</span>
									</div>
								</label>
							))}
						</div>
					</div>
				))}
				{state.tables.length === 0 && (
					<p className="py-8 text-center text-muted-foreground text-sm">
						No tables selected. Go back and select at least one
						table.
					</p>
				)}
			</CardContent>
		</Card>
	);
};
