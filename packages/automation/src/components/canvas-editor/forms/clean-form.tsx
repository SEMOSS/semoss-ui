import { Table2 } from "lucide-react";
import { useContext, useId } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Field,
	FieldLabel,
	Input,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
} from "@semoss/ui/next";
import {
	CLEAN_OPERATIONS,
	type CleanConfig,
	type CleanOperation,
} from "../../../domain/automation.types";
import { useAutomationInputPreview } from "../../../hooks/use-automation-input-preview";
import { AutomationVariableContext } from "../automation-variable-context";
import { BoundInput, PillInput } from "./pill-input";
import { PurgeFilterInput } from "./purge-filter-input";
import { StringListInput } from "./string-list-input";

interface CleanFormProps {
	/** Current cleaning configuration. */
	config: CleanConfig;
	/** Available upstream run values. */
	upstreamVars: string[];
	/** Publishes edits without mutating the input configuration. */
	onChange: (config: CleanConfig) => void;
	/** Locks the form for historical runs and read-only users. */
	readOnly?: boolean;
	/** Owning project used to read authorized historical table output. */
	appId?: string;
}

const CLEAN_OPERATION_LABELS: Record<CleanOperation, string> = {
	purge: "Purge rows",
	trim: "Trim text",
	replace: "Replace values",
	removeDuplicates: "Remove duplicate rows",
	filterEmpty: "Filter empty values",
	imputeNulls: "Impute null values",
	changeType: "Change column type",
	dropColumn: "Drop columns",
	renameColumn: "Rename column",
};

const CLEAN_DESCRIPTIONS: Record<CleanOperation, string> = {
	purge: "Remove rows only when all configured conditions match. Source database records are not deleted.",
	trim: "Remove leading and trailing whitespace from text in selected columns.",
	replace: "Replace matching values in selected columns.",
	removeDuplicates:
		"Remove repeated rows, keeping one copy of each full row.",
	filterEmpty:
		"Remove rows with null or empty values in any selected column.",
	imputeNulls: "Fill missing values using defaults based on the column type.",
	changeType: "Convert a column to text, category, number, or date.",
	dropColumn: "Remove selected columns from this working dataset.",
	renameColumn: "Rename a column in this working dataset.",
};

/** Configures native BI cleaning without allowing arbitrary execution code. */
export function CleanForm({
	config,
	upstreamVars,
	onChange,
	readOnly = false,
	appId = "",
}: CleanFormProps) {
	const id = useId();
	const { entries, onOpenInputTable } = useContext(AutomationVariableContext);
	const sourceName = config.source
		.trim()
		.match(/^\$\{([A-Za-z_][A-Za-z0-9_]*)\}$/)?.[1];
	const sourceEntry = entries.find(
		(entry) => entry.name === sourceName && entry.source === "node",
	);
	const input = useAutomationInputPreview(
		appId,
		sourceEntry?.sourceNodeId,
		config.source,
	);
	const availableColumns = input.preview?.columns ?? [];
	const operation = config.operation;
	const targetTypes = ["STRING", "FACTOR", "DOUBLE", "DATE"];
	const inputPreviewControls = (
		<>
			<P className="text-muted-foreground text-xs">
				Select an upstream table, then open its prior output for column
				names and sample values. No steps are executed.
			</P>
			<Button
				type="button"
				variant="outline"
				className="self-start"
				disabled={
					!appId ||
					!onOpenInputTable ||
					!sourceEntry?.sourceNodeId ||
					input.loading
				}
				onClick={async () => {
					const preview = await input.load();
					if (preview && sourceEntry?.sourceNodeId) {
						onOpenInputTable?.(
							sourceEntry.sourceNodeId,
							sourceEntry.label,
							preview,
						);
					}
				}}
			>
				{input.loading ? (
					<Spinner className="size-4" />
				) : (
					<Table2 className="size-4" aria-hidden="true" />
				)}
				Open input table
			</Button>
			{input.error && (
				<Alert variant="destructive">
					<AlertDescription>{input.error}</AlertDescription>
				</Alert>
			)}
			{input.empty && (
				<P className="text-muted-foreground text-xs">
					No successful upstream table output was found in the 20 most
					recent runs. Enter columns manually until output is
					available.
				</P>
			)}
			{input.preview && (
				<P className="text-muted-foreground text-xs">
					Historical sample from {input.preview.startedAt}. Current
					data or upstream edits may differ.
				</P>
			)}
		</>
	);
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
			{inputPreviewControls}
			<Field>
				<FieldLabel htmlFor={`${id}-clean-operation`}>
					Operation
				</FieldLabel>
				<Select
					value={operation}
					onValueChange={(value) => {
						if (
							CLEAN_OPERATIONS.includes(value as CleanOperation)
						) {
							onChange({
								...config,
								operation: value as CleanOperation,
							});
						}
					}}
					disabled={readOnly}
				>
					<SelectTrigger
						id={`${id}-clean-operation`}
						className="w-full"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{CLEAN_OPERATIONS.map((cleanOperation) => (
							<SelectItem
								key={cleanOperation}
								value={cleanOperation}
							>
								{CLEAN_OPERATION_LABELS[cleanOperation]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</Field>
			<P className="text-muted-foreground text-sm">
				{CLEAN_DESCRIPTIONS[operation]}
			</P>
			{operation === "purge" ? (
				<PurgeFilterInput
					value={config.filters}
					onChange={(filters) => onChange({ ...config, filters })}
					readOnly={readOnly}
					columns={input.preview?.columns}
					sampleRows={input.preview?.page.rows}
				/>
			) : (
				<>
					{operation === "changeType" ? (
						<>
							<Field>
								<FieldLabel htmlFor={`${id}-change-column`}>
									Column
								</FieldLabel>
								<Input
									id={`${id}-change-column`}
									value={config.column}
									list={
										availableColumns.length
											? `${id}-input-columns`
											: undefined
									}
									onChange={(event) =>
										onChange({
											...config,
											column: event.target.value,
										})
									}
									placeholder="Column name"
									readOnly={readOnly}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor={`${id}-change-type`}>
									New type
								</FieldLabel>
								<Select
									value={config.dataType}
									onValueChange={(dataType) =>
										onChange({ ...config, dataType })
									}
									disabled={readOnly}
								>
									<SelectTrigger
										id={`${id}-change-type`}
										className="w-full"
									>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{targetTypes.map((dataType) => (
											<SelectItem
												key={dataType}
												value={dataType}
											>
												{dataType}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>
						</>
					) : operation === "renameColumn" ? (
						<>
							<Field>
								<FieldLabel htmlFor={`${id}-rename-column`}>
									Column
								</FieldLabel>
								<Input
									id={`${id}-rename-column`}
									value={config.column}
									list={
										availableColumns.length
											? `${id}-input-columns`
											: undefined
									}
									onChange={(event) =>
										onChange({
											...config,
											column: event.target.value,
										})
									}
									placeholder="Column to rename"
									readOnly={readOnly}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor={`${id}-new-column`}>
									New column name
								</FieldLabel>
								<Input
									id={`${id}-new-column`}
									value={config.newColumn}
									onChange={(event) =>
										onChange({
											...config,
											newColumn: event.target.value,
										})
									}
									placeholder="New column name"
									readOnly={readOnly}
								/>
							</Field>
						</>
					) : operation !== "removeDuplicates" ? (
						<StringListInput
							label="Columns"
							itemLabel="Column"
							values={config.columns}
							onChange={(columns) =>
								onChange({ ...config, columns })
							}
							upstreamVars={[]}
							placeholder="Column name"
							readOnly={readOnly}
						/>
					) : (
						<P className="text-muted-foreground text-sm">
							Duplicates are compared across all columns.
						</P>
					)}
					{availableColumns.length > 0 && (
						<datalist id={`${id}-input-columns`}>
							{availableColumns.map((column) => (
								<option key={column.name} value={column.name}>
									{column.type}
								</option>
							))}
						</datalist>
					)}
				</>
			)}
			{operation === "replace" && (
				<>
					<BoundInput
						label="Find value"
						value={config.value}
						onChange={(value) => onChange({ ...config, value })}
						upstreamVars={upstreamVars}
						readOnly={readOnly}
					/>
					<BoundInput
						label="Replacement"
						value={config.newValue}
						onChange={(newValue) =>
							onChange({ ...config, newValue })
						}
						upstreamVars={upstreamVars}
						readOnly={readOnly}
					/>
				</>
			)}
		</div>
	);
}
