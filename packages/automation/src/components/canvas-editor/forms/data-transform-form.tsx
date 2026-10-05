import { useId } from "react";
import {
	Field,
	FieldDescription,
	FieldLabel,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import type {
	DataTransformConfig,
	DataTransformOperation,
} from "../../../domain/automation.types";
import { PillInput } from "./pill-input";

interface DataTransformFormProps {
	config: DataTransformConfig;
	upstreamVars: string[];
	onChange: (config: DataTransformConfig) => void;
	readOnly?: boolean;
}

const OPERATION_LABELS: Record<DataTransformOperation, string> = {
	select: "Keep selected columns",
	remove: "Remove columns",
	rename: "Rename columns",
	filter: "Filter rows",
	fillMissing: "Fill missing values",
	sort: "Sort rows",
	deduplicate: "Remove duplicate rows",
};

/** Configures one predictable row transformation without exposing frame code. */
export function DataTransformForm({
	config,
	upstreamVars,
	onChange,
	readOnly = false,
}: DataTransformFormProps) {
	const operationId = useId();
	const operatorId = useId();
	const sortId = useId();
	const needsColumns = ["select", "remove", "sort", "deduplicate"].includes(
		config.operation,
	);
	const needsMapping = ["rename", "fillMissing"].includes(config.operation);
	const filterNeedsValue = !["isEmpty", "isNotEmpty"].includes(
		config.operator,
	);

	return (
		<div className="flex flex-col gap-5">
			<div className="rounded-lg border bg-muted/20 p-3">
				<p className="font-medium text-sm">Transform rows</p>
				<p className="mt-1 text-muted-foreground text-xs">
					Choose data from an earlier step and apply one clear change.
					Chain transform nodes when you need several changes.
				</p>
			</div>

			<PillInput
				label="Rows to transform"
				required
				value={config.source}
				onChange={(source) => onChange({ ...config, source })}
				upstreamVars={upstreamVars}
				placeholder="Choose database rows or another list of records"
				description="The selected value must be a list of objects with consistent column names."
				mono
				minRows={2}
				readOnly={readOnly}
			/>

			<Field>
				<FieldLabel htmlFor={operationId}>Change to make</FieldLabel>
				<Select
					value={config.operation}
					onValueChange={(operation) =>
						onChange({
							...config,
							operation: operation as DataTransformOperation,
						})
					}
					disabled={readOnly}
				>
					<SelectTrigger id={operationId} className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{Object.entries(OPERATION_LABELS).map(
							([value, label]) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							),
						)}
					</SelectContent>
				</Select>
			</Field>

			{needsColumns && (
				<PillInput
					label={
						config.operation === "deduplicate"
							? "Columns that identify a duplicate (optional)"
							: "Columns"
					}
					required={config.operation !== "deduplicate"}
					value={config.columns}
					onChange={(columns) => onChange({ ...config, columns })}
					upstreamVars={[]}
					placeholder="customer_id, order_date"
					description={
						config.operation === "deduplicate"
							? "Leave blank to compare every column."
							: "Enter one or more column names separated by commas."
					}
					readOnly={readOnly}
				/>
			)}

			{needsMapping && (
				<PillInput
					label={
						config.operation === "rename"
							? "Old and new column names"
							: "Columns and replacement values"
					}
					required
					value={config.mapping}
					onChange={(mapping) => onChange({ ...config, mapping })}
					upstreamVars={upstreamVars}
					placeholder={
						config.operation === "rename"
							? '{"old_name": "new_name"}'
							: '{"status": "Unknown"}'
					}
					description="Enter a JSON object."
					mono
					minRows={3}
					readOnly={readOnly}
				/>
			)}

			{config.operation === "filter" && (
				<>
					<PillInput
						label="Column"
						required
						value={config.column}
						onChange={(column) => onChange({ ...config, column })}
						upstreamVars={[]}
						placeholder="status"
						readOnly={readOnly}
					/>
					<Field>
						<FieldLabel htmlFor={operatorId}>Comparison</FieldLabel>
						<Select
							value={config.operator}
							onValueChange={(operator) =>
								onChange({
									...config,
									operator:
										operator as DataTransformConfig["operator"],
								})
							}
							disabled={readOnly}
						>
							<SelectTrigger id={operatorId} className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="equals">Equals</SelectItem>
								<SelectItem value="notEquals">
									Does not equal
								</SelectItem>
								<SelectItem value="contains">
									Contains text
								</SelectItem>
								<SelectItem value="greaterThan">
									Greater than
								</SelectItem>
								<SelectItem value="greaterThanOrEqual">
									Greater than or equal
								</SelectItem>
								<SelectItem value="lessThan">
									Less than
								</SelectItem>
								<SelectItem value="lessThanOrEqual">
									Less than or equal
								</SelectItem>
								<SelectItem value="isEmpty">
									Is empty
								</SelectItem>
								<SelectItem value="isNotEmpty">
									Is not empty
								</SelectItem>
							</SelectContent>
						</Select>
					</Field>
					{filterNeedsValue && (
						<PillInput
							label="Value"
							required
							value={config.value}
							onChange={(value) => onChange({ ...config, value })}
							upstreamVars={upstreamVars}
							placeholder="Complete"
							description="Numbers, true, false, null, and quoted JSON strings are supported."
							readOnly={readOnly}
						/>
					)}
				</>
			)}

			{config.operation === "sort" && (
				<Field>
					<FieldLabel htmlFor={sortId}>Direction</FieldLabel>
					<Select
						value={config.descending ? "descending" : "ascending"}
						onValueChange={(value) =>
							onChange({
								...config,
								descending: value === "descending",
							})
						}
						disabled={readOnly}
					>
						<SelectTrigger id={sortId} className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ascending">Ascending</SelectItem>
							<SelectItem value="descending">
								Descending
							</SelectItem>
						</SelectContent>
					</Select>
					<FieldDescription>
						Applies to the columns in the order entered.
					</FieldDescription>
				</Field>
			)}
		</div>
	);
}
