import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
	Button,
	FieldDescription,
	FieldError,
	FieldLegend,
	FieldSet,
} from "@semoss/ui/next";
import { parseJsonStringArray } from "@semoss/utility/json";
import { type InputMode, InputModeToggle } from "./input-mode-toggle";
import { BoundInput, PillInput } from "./pill-input";

interface StringListInputProps {
	label: string;
	values: string[];
	onChange: (values: string[]) => void;
	upstreamVars: string[];
	itemLabel: string;
	placeholder?: string;
	description?: string;
	readOnly?: boolean;
}

function normalizedValues(values: string[]): string[] {
	return values.length === 1 && values[0] === "" ? [] : values;
}

/** Edits an ordered string list through guided rows or the equivalent JSON array. */
export function StringListInput({
	label,
	values,
	onChange,
	upstreamVars,
	itemLabel,
	placeholder,
	description,
	readOnly = false,
}: StringListInputProps) {
	const [inputMode, setInputMode] = useState<InputMode>("form");
	const [jsonDraft, setJsonDraft] = useState(() =>
		JSON.stringify(normalizedValues(values), null, 2),
	);
	const [jsonError, setJsonError] = useState("");
	const displayedValues = values.length > 0 ? values : [""];

	const handleModeChange = (nextMode: InputMode): void => {
		if (nextMode === "json") {
			setJsonDraft(JSON.stringify(normalizedValues(values), null, 2));
			setJsonError("");
			setInputMode("json");
			return;
		}

		const parsed = parseJsonStringArray(jsonDraft);
		if (parsed === null) {
			setJsonError("Enter a JSON array containing only text values.");
			return;
		}
		onChange(parsed);
		setJsonError("");
		setInputMode("form");
	};

	const handleJsonChange = (value: string): void => {
		setJsonDraft(value);
		const parsed = parseJsonStringArray(value);
		if (parsed === null) {
			setJsonError("Enter a JSON array containing only text values.");
			return;
		}
		setJsonError("");
		onChange(parsed);
	};

	return (
		<div className="flex flex-col gap-2">
			<InputModeToggle
				value={inputMode}
				onValueChange={handleModeChange}
				formDisabled={jsonError !== ""}
			/>
			{inputMode === "form" ? (
				<FieldSet className="gap-2">
					<FieldLegend variant="label" className="mb-0">
						{label}
					</FieldLegend>
					{description && (
						<FieldDescription>{description}</FieldDescription>
					)}
					{!readOnly && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="self-start"
							onClick={() => onChange([...displayedValues, ""])}
						>
							<Plus className="size-3.5" aria-hidden="true" />
							Add {itemLabel.toLowerCase()}
						</Button>
					)}
					<div className="flex flex-col gap-2">
						{displayedValues.map((value, index) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: Config values have no persisted identity and rows cannot be reordered.
								key={`${itemLabel}-${index}`}
								className="flex items-end gap-2 rounded-lg border bg-card p-2"
							>
								<div className="min-w-0 flex-1">
									<PillInput
										label={`${itemLabel} ${index + 1}`}
										value={value}
										placeholder={placeholder}
										onChange={(nextValue) => {
											const next = [...displayedValues];
											next[index] = nextValue;
											onChange(next);
										}}
										upstreamVars={upstreamVars}
										readOnly={readOnly}
									/>
								</div>
								{!readOnly && displayedValues.length > 1 && (
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="mb-0.5 size-8 text-muted-foreground hover:text-destructive"
										aria-label={`Remove ${itemLabel.toLowerCase()} ${index + 1}`}
										onClick={() =>
											onChange(
												displayedValues.filter(
													(_, itemIndex) =>
														itemIndex !== index,
												),
											)
										}
									>
										<Trash2
											className="size-4"
											aria-hidden="true"
										/>
									</Button>
								)}
							</div>
						))}
					</div>
				</FieldSet>
			) : (
				<>
					<BoundInput
						label={`${label} (JSON)`}
						value={jsonDraft}
						placeholder='["report.pdf", "summary.pdf"]'
						description="Enter a JSON array of text values. Variables can be used inside quoted values."
						onChange={handleJsonChange}
						upstreamVars={upstreamVars}
						readOnly={readOnly}
						mono
					/>
					<FieldError>{jsonError}</FieldError>
				</>
			)}
		</div>
	);
}
