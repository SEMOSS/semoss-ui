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
import type { DataExtractConfig } from "../../../domain/automation.types";
import { PillInput } from "./pill-input";

interface DataExtractFormProps {
	config: DataExtractConfig;
	upstreamVars: string[];
	onChange: (config: DataExtractConfig) => void;
	readOnly?: boolean;
}

/** Configures a business-facing lookup without exposing parsing code. */
export function DataExtractForm({
	config,
	upstreamVars,
	onChange,
	readOnly = false,
}: DataExtractFormProps) {
	const formatId = useId();

	return (
		<div className="flex flex-col gap-5">
			<div className="rounded-lg border bg-muted/20 p-3">
				<p className="font-medium text-sm">Find a value</p>
				<p className="mt-1 text-muted-foreground text-xs">
					Choose JSON/XML data or a file downloaded earlier in this
					run, then enter the value path to read.
				</p>
			</div>

			<PillInput
				label="Data or downloaded file"
				required
				value={config.source}
				onChange={(source) => onChange({ ...config, source })}
				upstreamVars={upstreamVars}
				placeholder="Choose data from an earlier step"
				description="For a downloaded file, insert its File path output. Inline JSON or XML also works."
				mono
				minRows={2}
				readOnly={readOnly}
			/>

			<Field>
				<FieldLabel htmlFor={formatId}>Data format</FieldLabel>
				<Select
					value={config.format}
					onValueChange={(format) =>
						onChange({
							...config,
							format: format as DataExtractConfig["format"],
						})
					}
					disabled={readOnly}
				>
					<SelectTrigger id={formatId} className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="auto">
							Detect automatically
						</SelectItem>
						<SelectItem value="json">JSON</SelectItem>
						<SelectItem value="xml">XML</SelectItem>
					</SelectContent>
				</Select>
				<FieldDescription>
					Automatic detection works for most JSON and XML files.
				</FieldDescription>
			</Field>

			<PillInput
				label="Value path"
				required
				value={config.path}
				onChange={(path) => onChange({ ...config, path })}
				upstreamVars={[]}
				placeholder="orders[0].customer.name"
				description="Use dots for nested fields and brackets for list positions, for example items[0].id. For XML, start with the outer element."
				mono
				minRows={2}
				readOnly={readOnly}
			/>

			<PillInput
				label="If the path is missing"
				value={config.missingValue}
				onChange={(missingValue) =>
					onChange({ ...config, missingValue })
				}
				upstreamVars={upstreamVars}
				placeholder="Not available"
				description="Return this value when the path does not exist. JSON values such as 0, false, or {} are supported."
				readOnly={readOnly}
			/>

			<PillInput
				label="If the value is null"
				value={config.nullValue}
				onChange={(nullValue) => onChange({ ...config, nullValue })}
				upstreamVars={upstreamVars}
				placeholder="Not provided"
				description="Return this value when the path exists but its value is null or an empty XML element. Leave blank to return null."
				readOnly={readOnly}
			/>
		</div>
	);
}
