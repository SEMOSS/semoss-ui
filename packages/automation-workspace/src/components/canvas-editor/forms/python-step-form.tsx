import { useEffect, useState } from "react";
import { Field, FieldLabel, Textarea } from "@semoss/ui/next";
import type { PythonStepConfig } from "../../../domain/automation.types";

interface PythonStepFormProps {
	config: PythonStepConfig;
	onChange: (config: PythonStepConfig) => void;
}

function isInputMappings(value: unknown): value is Record<string, string> {
	return (
		typeof value === "object" &&
		value !== null &&
		!Array.isArray(value) &&
		Object.values(value).every((input) => typeof input === "string")
	);
}

export function PythonStepForm({ config, onChange }: PythonStepFormProps) {
	const [inputsText, setInputsText] = useState(
		JSON.stringify(config.inputs, null, 2),
	);
	const [inputsError, setInputsError] = useState<string | null>(null);

	useEffect(() => {
		setInputsText(JSON.stringify(config.inputs, null, 2));
	}, [config.inputs]);

	return (
		<div className="space-y-4">
			<div>
				<p className="font-medium text-sm">1. Setup</p>
				<p className="mt-1 text-[11px] text-muted-foreground">
					Describe the action and its data contract, then generate the
					project-owned Python step below.
				</p>
			</div>
			<Field>
				<FieldLabel className="text-xs">
					What should this action do?
				</FieldLabel>
				<Textarea
					rows={3}
					value={config.purpose}
					onChange={(event) =>
						onChange({
							...config,
							purpose: event.target.value,
						})
					}
					placeholder="e.g. Normalize the GitHub ticket records returned by the previous step."
				/>
				<p className="mt-1 text-[11px] text-muted-foreground">
					Required before this step can be generated.
				</p>
			</Field>
			<Field>
				<FieldLabel className="text-xs">
					Input mappings (JSON)
				</FieldLabel>
				<Textarea
					className="font-mono text-xs"
					rows={4}
					value={inputsText}
					onChange={(event) => {
						setInputsText(event.target.value);
						try {
							const inputs = JSON.parse(event.target.value);
							if (!isInputMappings(inputs)) {
								throw new Error(
									"Input mappings must be a JSON object with string values.",
								);
							}
							onChange({ ...config, inputs });
							setInputsError(null);
						} catch {
							setInputsError(
								"Input mappings must be a valid JSON object.",
							);
						}
					}}
					placeholder={`{ "tickets": "\${github_out}" }`}
				/>
				{inputsError && (
					<p className="mt-1 text-destructive text-xs">
						{inputsError}
					</p>
				)}
			</Field>
			<Field>
				<FieldLabel className="text-xs">Expected result</FieldLabel>
				<Textarea
					rows={2}
					value={config.outputDescription}
					onChange={(event) =>
						onChange({
							...config,
							outputDescription: event.target.value,
						})
					}
					placeholder="e.g. A list of normalized tickets with id, status, and changed_at."
				/>
			</Field>
		</div>
	);
}
