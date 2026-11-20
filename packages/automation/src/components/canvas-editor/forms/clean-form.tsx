import { useId } from "react";
import {
	Field,
	FieldLabel,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import {
	CLEAN_OPERATIONS,
	type CleanConfig,
	type CleanOperation,
} from "../../../domain/automation.types";
import { InputTableInspector } from "./input-table-inspector";
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
	/** Owning automation project used to read authorized retained run data. */
	appId?: string;
}

const CLEAN_OPERATION_LABELS: Record<CleanOperation, string> = {
	purge: "Drop rows",
	trim: "Trim text",
	replace: "Replace values",
	removeDuplicates: "Remove duplicate rows",
	filterEmpty: "Filter empty values",
	imputeNulls: "Impute null values",
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
	const operation = config.operation;
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
				/>
			) : operation !== "removeDuplicates" ? (
				<StringListInput
					label="Columns"
					itemLabel="Column"
					values={config.columns}
					onChange={(columns) => onChange({ ...config, columns })}
					upstreamVars={[]}
					placeholder="Column name"
					readOnly={readOnly}
				/>
			) : (
				<P className="text-muted-foreground text-sm">
					Duplicates are compared across all columns.
				</P>
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
