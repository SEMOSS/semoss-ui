import { useId } from "react";
import {
	Checkbox,
	Field,
	FieldLabel,
	Input,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import {
	TRANSFORM_OPERATIONS,
	type TransformConfig,
	type TransformOperation,
} from "../../../domain/automation.types";
import { InputTableInspector } from "./input-table-inspector";
import { PillInput } from "./pill-input";
import { StringListInput } from "./string-list-input";

interface TransformFormProps {
	config: TransformConfig;
	upstreamVars: string[];
	onChange: (config: TransformConfig) => void;
	readOnly?: boolean;
	/** Owning automation project used to read authorized retained run data. */
	appId?: string;
}

const TRANSFORM_OPERATION_LABELS: Record<TransformOperation, string> = {
	changeType: "Change column type",
	dropColumn: "Drop columns",
	renameColumn: "Rename column",
	addColumn: "Add column",
	duplicateColumn: "Duplicate column",
	concatenate: "Concatenate columns",
	pivot: "Pivot",
	lowerCase: "Lower case",
	properCase: "Proper case",
	split: "Split columns",
	splitUnpivot: "Split and unpivot",
	timestampData: "Add timestamp data",
	toPercent: "Convert to percent",
	transpose: "Transpose",
	unpivot: "Unpivot",
	upperCase: "Upper case",
	join: "Join tables",
};

const TRANSFORM_DESCRIPTIONS: Record<TransformOperation, string> = {
	changeType: "Convert a column to text, category, number, or date.",
	dropColumn: "Remove selected columns from this working dataset.",
	renameColumn: "Rename a column in this working dataset.",
	addColumn: "Add a new empty column to this working dataset.",
	duplicateColumn: "Copy an existing column into a new column.",
	concatenate: "Combine selected columns into a new text column.",
	pivot: "Turn unique values from one column into columns.",
	lowerCase: "Convert selected text columns to lower case.",
	properCase: "Convert selected text columns to proper case.",
	split: "Split selected columns into separate columns using a delimiter.",
	splitUnpivot: "Split selected values and expand them into separate rows.",
	timestampData: "Add a new date or timestamp column.",
	toPercent: "Format a numeric column as percentage text.",
	transpose: "Swap rows and columns in the working dataset.",
	unpivot: "Convert selected columns into variable and value rows.",
	upperCase: "Convert selected text columns to upper case.",
	join: "Combine two upstream tables using matching key columns.",
};

const TARGET_TYPES = ["STRING", "FACTOR", "DOUBLE", "DATE"];

/** Configures schema transforms without allowing arbitrary execution code. */
export function TransformForm({
	config,
	upstreamVars,
	onChange,
	readOnly = false,
	appId = "",
}: TransformFormProps) {
	const id = useId();
	const renderColumnField = (
		fieldId: string,
		label: string,
		value: string,
		onChange: (value: string) => void,
		placeholder = "Column name",
	) => (
		<Field>
			<FieldLabel htmlFor={`${id}-${fieldId}`}>{label}</FieldLabel>
			<Input
				id={`${id}-${fieldId}`}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				readOnly={readOnly}
			/>
		</Field>
	);
	const renderNewColumnField = () => (
		<Field>
			<FieldLabel htmlFor={`${id}-new-column`}>
				New column name
			</FieldLabel>
			<Input
				id={`${id}-new-column`}
				value={config.newColumn}
				onChange={(event) =>
					onChange({ ...config, newColumn: event.target.value })
				}
				placeholder="New column name"
				readOnly={readOnly}
			/>
		</Field>
	);
	const renderColumnsField = (label = "Columns") => (
		<StringListInput
			label={label}
			itemLabel="Column"
			values={config.columns}
			onChange={(columns) => onChange({ ...config, columns })}
			upstreamVars={[]}
			placeholder="Column name"
			readOnly={readOnly}
		/>
	);
	const renderDelimiterField = () => (
		<Field>
			<FieldLabel htmlFor={`${id}-delimiter`}>Delimiter</FieldLabel>
			<Input
				id={`${id}-delimiter`}
				value={config.delimiter}
				onChange={(event) =>
					onChange({ ...config, delimiter: event.target.value })
				}
				placeholder=","
				readOnly={readOnly}
			/>
		</Field>
	);
	const renderDataTypeField = () => (
		<Field>
			<FieldLabel htmlFor={`${id}-change-type`}>New type</FieldLabel>
			<Select
				value={config.dataType}
				onValueChange={(dataType) => onChange({ ...config, dataType })}
				disabled={readOnly}
			>
				<SelectTrigger id={`${id}-change-type`} className="w-full">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{TARGET_TYPES.map((dataType) => (
						<SelectItem key={dataType} value={dataType}>
							{dataType}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</Field>
	);
	const renderCheckbox = (
		fieldId: string,
		label: string,
		checked: boolean,
		onCheckedChange: (checked: boolean) => void,
	) => (
		<Field>
			<div className="flex items-center gap-2">
				<Checkbox
					id={`${id}-${fieldId}`}
					checked={checked}
					onCheckedChange={(value) => onCheckedChange(value === true)}
					disabled={readOnly}
				/>
				<FieldLabel htmlFor={`${id}-${fieldId}`}>{label}</FieldLabel>
			</div>
		</Field>
	);
	const renderOperationFields = () => {
		switch (config.operation) {
			case "changeType":
				return (
					<>
						{renderColumnField(
							"change-column",
							"Column",
							config.column,
							(column) => onChange({ ...config, column }),
						)}
						{renderDataTypeField()}
					</>
				);
			case "dropColumn":
			case "lowerCase":
			case "properCase":
			case "upperCase":
			case "unpivot":
				return renderColumnsField();
			case "renameColumn":
				return (
					<>
						{renderColumnField(
							"rename-column",
							"Column",
							config.column,
							(column) => onChange({ ...config, column }),
							"Column to rename",
						)}
						{renderNewColumnField()}
					</>
				);
			case "addColumn":
				return (
					<>
						{renderNewColumnField()}
						{renderDataTypeField()}
					</>
				);
			case "duplicateColumn":
				return (
					<>
						{renderColumnField(
							"duplicate-column",
							"Column to duplicate",
							config.column,
							(column) => onChange({ ...config, column }),
						)}
						{renderNewColumnField()}
					</>
				);
			case "concatenate":
				return (
					<>
						{renderColumnsField()}
						{renderDelimiterField()}
						{renderNewColumnField()}
					</>
				);
			case "pivot":
				return (
					<>
						{renderColumnField(
							"pivot-column",
							"Pivot column",
							config.pivotColumn,
							(pivotColumn) =>
								onChange({ ...config, pivotColumn }),
						)}
						{renderColumnField(
							"value-column",
							"Value column",
							config.valueColumn,
							(valueColumn) =>
								onChange({ ...config, valueColumn }),
						)}
						<StringListInput
							label="Columns to keep (optional)"
							itemLabel="Column"
							values={config.maintainColumns}
							onChange={(maintainColumns) =>
								onChange({
									...config,
									maintainColumns: maintainColumns.filter(
										(column) => column.trim(),
									),
								})
							}
							upstreamVars={[]}
							placeholder="Column name"
							readOnly={readOnly}
						/>
						<Field>
							<FieldLabel htmlFor={`${id}-aggregate-function`}>
								Aggregate function
							</FieldLabel>
							<Select
								value={config.aggregateFunction || "none"}
								onValueChange={(aggregateFunction) =>
									onChange({
										...config,
										aggregateFunction:
											aggregateFunction === "none"
												? ""
												: aggregateFunction,
									})
								}
								disabled={readOnly}
							>
								<SelectTrigger
									id={`${id}-aggregate-function`}
									className="w-full"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">None</SelectItem>
									{["sum", "mean", "median"].map(
										(aggregate) => (
											<SelectItem
												key={aggregate}
												value={aggregate}
											>
												{aggregate}
											</SelectItem>
										),
									)}
								</SelectContent>
							</Select>
						</Field>
					</>
				);
			case "split":
			case "splitUnpivot":
				return (
					<>
						{renderColumnsField()}
						{renderDelimiterField()}
					</>
				);
			case "timestampData":
				return (
					<>
						{renderNewColumnField()}
						{renderCheckbox(
							"include-time",
							"Include time",
							config.includeTime,
							(includeTime) =>
								onChange({ ...config, includeTime }),
						)}
					</>
				);
			case "toPercent":
				return (
					<>
						{renderColumnField(
							"percent-column",
							"Column",
							config.column,
							(column) => onChange({ ...config, column }),
						)}
						{renderNewColumnField()}
						<Field>
							<FieldLabel htmlFor={`${id}-sig-digits`}>
								Significant digits
							</FieldLabel>
							<Input
								id={`${id}-sig-digits`}
								type="number"
								min={0}
								max={20}
								value={config.sigDigits}
								onChange={(event) =>
									onChange({
										...config,
										sigDigits:
											event.target.value === ""
												? 0
												: Number(event.target.value),
									})
								}
								readOnly={readOnly}
							/>
						</Field>
						{renderCheckbox(
							"by-100",
							"Multiply by 100",
							config.by100,
							(by100) => onChange({ ...config, by100 }),
						)}
					</>
				);
			case "join":
				return (
					<>
						<PillInput
							label="Right table"
							required
							value={config.rightSource}
							onChange={(rightSource) =>
								onChange({ ...config, rightSource })
							}
							upstreamVars={upstreamVars}
							placeholder="${other_table}"
							readOnly={readOnly}
						/>
						<InputTableInspector
							appId={appId}
							source={config.rightSource}
							label="right table"
						/>
						{renderColumnField(
							"left-join-column",
							"Left join column",
							config.column,
							(column) => onChange({ ...config, column }),
						)}
						{renderColumnField(
							"right-join-column",
							"Right join column",
							config.rightColumn,
							(rightColumn) =>
								onChange({ ...config, rightColumn }),
							"Column in right table",
						)}
						<Field>
							<FieldLabel htmlFor={`${id}-join-type`}>
								Join type
							</FieldLabel>
							<Select
								value={config.joinType}
								onValueChange={(joinType) =>
									onChange({ ...config, joinType })
								}
								disabled={readOnly}
							>
								<SelectTrigger
									id={`${id}-join-type`}
									className="w-full"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="inner.join">
										Inner join
									</SelectItem>
									<SelectItem value="left.outer.join">
										Left outer join
									</SelectItem>
									<SelectItem value="right.outer.join">
										Right outer join
									</SelectItem>
								</SelectContent>
							</Select>
						</Field>
					</>
				);
			case "transpose":
				return null;
		}
	};

	return (
		<div className="flex min-w-0 flex-col gap-4">
			<PillInput
				label="Input table"
				required
				value={config.source}
				onChange={(source) => onChange({ ...config, source })}
				upstreamVars={upstreamVars}
				placeholder="${query_result}"
				readOnly={readOnly}
			/>
			<InputTableInspector appId={appId} source={config.source} />
			<Field>
				<FieldLabel htmlFor={`${id}-transform-operation`}>
					Operation
				</FieldLabel>
				<Select
					value={config.operation}
					onValueChange={(value) => {
						if (
							TRANSFORM_OPERATIONS.includes(
								value as TransformOperation,
							)
						) {
							onChange({
								...config,
								operation: value as TransformOperation,
							});
						}
					}}
					disabled={readOnly}
				>
					<SelectTrigger
						id={`${id}-transform-operation`}
						className="w-full"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{TRANSFORM_OPERATIONS.map((operation) => (
							<SelectItem key={operation} value={operation}>
								{TRANSFORM_OPERATION_LABELS[operation]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</Field>
			<P className="text-muted-foreground text-sm">
				{TRANSFORM_DESCRIPTIONS[config.operation]}
			</P>
			{renderOperationFields()}
		</div>
	);
}
