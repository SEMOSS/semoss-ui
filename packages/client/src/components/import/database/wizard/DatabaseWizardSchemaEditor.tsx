import type React from "react";
import { useId } from "react";
import {
	Button,
	Input,
	Label,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import {
	ALLOWED_SQL_TYPES,
	type AllowedSqlType,
} from "@/utils/databaseWizard/allowedTypes";

export type SchemaEditorColumn = {
	name: string;
	type: AllowedSqlType;
	description: string;
};

export type DatabaseWizardSchemaEditorProps = {
	tableName: string;
	columns: SchemaEditorColumn[];
	onTableNameChange: (value: string) => void;
	onColumnChange: (index: number, patch: Partial<SchemaEditorColumn>) => void;
	onAddColumn: () => void;
	onDeleteColumn: (index: number) => void;
};

export const DatabaseWizardSchemaEditor: React.FC<
	DatabaseWizardSchemaEditorProps
> = ({
	tableName,
	columns,
	onTableNameChange,
	onColumnChange,
	onAddColumn,
	onDeleteColumn,
}) => {
	const tableNameId = useId();
	const baseId = useId();

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<Label htmlFor={tableNameId}>Table name</Label>
				<Input
					id={tableNameId}
					value={tableName}
					onChange={(event) => onTableNameChange(event.target.value)}
					placeholder="table_name"
				/>
			</div>
			<div className="flex items-center justify-between">
				<P className="text-muted-foreground text-sm">Columns</P>
				<Button size="sm" variant="outline" onClick={onAddColumn}>
					Add column
				</Button>
			</div>
			<div className="flex flex-col gap-3">
				{columns.length === 0 && (
					<P className="text-muted-foreground text-sm">
						No columns yet. Add one to continue.
					</P>
				)}
				{columns.map((column, index) => {
					const nameId = `${baseId}-name-${index}`;
					const typeId = `${baseId}-type-${index}`;
					const descId = `${baseId}-desc-${index}`;
					return (
						<div
							key={`${column.name}-${index}`}
							className="flex flex-col gap-2 rounded-md border border-border p-3"
						>
							<div className="grid gap-2 md:grid-cols-[2fr_1fr_auto]">
								<div className="flex flex-col gap-2">
									<Label htmlFor={nameId}>Column name</Label>
									<Input
										id={nameId}
										value={column.name}
										onChange={(event) =>
											onColumnChange(index, {
												name: event.target.value,
											})
										}
										placeholder="column_name"
									/>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor={typeId}>Data type</Label>
									<Select
										value={column.type}
										onValueChange={(value) =>
											onColumnChange(index, {
												type: value as AllowedSqlType,
											})
										}
									>
										<SelectTrigger id={typeId}>
											<SelectValue placeholder="Select type" />
										</SelectTrigger>
										<SelectContent>
											{ALLOWED_SQL_TYPES.map((type) => (
												<SelectItem
													key={type}
													value={type}
												>
													{type}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<Button
									variant="ghost"
									size="sm"
									className="self-end"
									onClick={() => onDeleteColumn(index)}
								>
									X
								</Button>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor={descId}>Description</Label>
								<Input
									id={descId}
									value={column.description}
									onChange={(event) =>
										onColumnChange(index, {
											description: event.target.value,
										})
									}
									placeholder="Describe the column"
								/>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};
