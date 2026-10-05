import { ChevronDown, ExternalLink } from "lucide-react";
import { useId } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Field,
	FieldDescription,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import type { BrowserPlaywrightConfig } from "../../../domain/automation.types";
import { PillInput } from "./pill-input";
import { AutomationProjectSelect } from "./project-select";

interface BrowserPlaywrightFormProps {
	config: BrowserPlaywrightConfig;
	upstreamVars: string[];
	onChange: (config: BrowserPlaywrightConfig) => void;
	readOnly?: boolean;
}

interface PlaywrightStep {
	type?: string | null;
	label?: string | null;
	text?: string | null;
	isPassword?: boolean | null;
}

interface PlaywrightStepsResponse {
	steps?: Record<string, PlaywrightStep[]>;
}

function parseInputs(value: string): Record<string, string> {
	try {
		const parsed: unknown = JSON.parse(value || "{}");
		if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
			return {};
		}
		return Object.fromEntries(
			Object.entries(parsed).map(([key, input]) => [
				key,
				typeof input === "string" ? input : JSON.stringify(input),
			]),
		);
	} catch {
		return {};
	}
}

function updateInput(inputs: string, label: string, value: string): string {
	const next = parseInputs(inputs);
	if (value) next[label] = value;
	else delete next[label];
	return JSON.stringify(next, null, 2);
}

/** Selects and parameterizes a recording owned by the existing Playwright app. */
export function BrowserPlaywrightForm({
	config,
	upstreamVars,
	onChange,
	readOnly = false,
}: BrowserPlaywrightFormProps) {
	const recordingId = useId();
	const timeoutId = useId();
	const timeoutDescriptionId = useId();
	const { data: recordings = [] } = usePixel<string[]>(
		config.projectId
			? `ListPlaywrightScripts(project=${JSON.stringify(config.projectId)});`
			: "",
		{ data: [] },
	);
	const { data: recordingSteps = {} } = usePixel<PlaywrightStepsResponse>(
		config.projectId && config.recordingFile
			? `GetAllStepsWithoutSession(project=${JSON.stringify(config.projectId)}, fileName=${JSON.stringify(config.recordingFile)});`
			: "",
		{ data: {} },
	);
	const inputs = parseInputs(config.inputs);
	const inputVariables = Object.values(recordingSteps.steps ?? {})
		.flat()
		.reduce<Array<{ label: string; text: string; isPassword: boolean }>>(
			(variables, step) => {
				if (
					(step.type !== "TYPE" && step.type !== "VARIABLE") ||
					typeof step.label !== "string" ||
					!step.label.trim() ||
					variables.some((variable) => variable.label === step.label)
				) {
					return variables;
				}
				variables.push({
					label: step.label,
					text: typeof step.text === "string" ? step.text : "",
					isPassword: step.isPassword === true,
				});
				return variables;
			},
			[],
		);

	return (
		<div className="flex flex-col gap-5">
			<div className="rounded-lg border bg-muted/20 p-3">
				<p className="font-medium text-sm">
					Replay a browser recording
				</p>
				<p className="mt-1 text-muted-foreground text-xs">
					Record and test the browser flow in Playwright, then select
					the saved recording here.
				</p>
			</div>

			<Field>
				<FieldLabel>Recording app</FieldLabel>
				<AutomationProjectSelect
					name={config.projectName || ""}
					value={config.projectId}
					projectTypes={["CODE", "BLOCKS"]}
					placeholder="Choose the app that owns the recording"
					clearable={false}
					disabled={readOnly}
					onChange={(projectId, projectName) =>
						onChange({
							...config,
							projectId,
							projectName,
							recordingFile: "",
							inputs: "{}",
						})
					}
				/>
				<FieldDescription>
					Access is checked using the same SEMOSS project permissions
					as the Playwright workspace.
				</FieldDescription>
			</Field>

			<Field>
				<FieldLabel htmlFor={recordingId}>Recording</FieldLabel>
				<Select
					value={config.recordingFile}
					onValueChange={(recordingFile) =>
						onChange({
							...config,
							recordingFile,
							inputs: "{}",
						})
					}
					disabled={readOnly || !config.projectId}
				>
					<SelectTrigger id={recordingId} className="w-full">
						<SelectValue placeholder="Choose a saved recording" />
					</SelectTrigger>
					<SelectContent>
						{recordings.map((recording) => (
							<SelectItem key={recording} value={recording}>
								{recording}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{config.projectId && recordings.length === 0 && (
					<FieldDescription>
						No saved recordings were found in this app.
					</FieldDescription>
				)}
			</Field>

			<PillInput
				label="Successful page starts with"
				required
				value={config.successUrlPrefix}
				onChange={(successUrlPrefix) =>
					onChange({ ...config, successUrlPrefix })
				}
				upstreamVars={[]}
				placeholder="https://example.com/complete"
				description="The run succeeds only after the browser reaches this page and becomes idle. Query parameters and fragments are ignored."
				mono
				readOnly={readOnly}
			/>

			{inputVariables.length > 0 && (
				<div className="flex flex-col gap-4">
					<div>
						<p className="font-medium text-sm">Run inputs</p>
						<p className="mt-1 text-muted-foreground text-xs">
							Values replace the matching fields recorded in the
							browser flow.
						</p>
					</div>
					{inputVariables.map((variable) => (
						<PillInput
							key={variable.label}
							label={variable.label}
							value={inputs[variable.label] ?? ""}
							onChange={(value) =>
								onChange({
									...config,
									inputs: updateInput(
										config.inputs,
										variable.label,
										value,
									),
								})
							}
							upstreamVars={upstreamVars}
							placeholder={
								variable.isPassword
									? "Enter at run time or insert data"
									: variable.text
							}
							description={
								variable.isPassword
									? "The saved value is not copied into the automation."
									: undefined
							}
							readOnly={readOnly}
						/>
					))}
				</div>
			)}

			<Collapsible>
				<CollapsibleTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="w-full justify-between"
					>
						Advanced inputs
						<ChevronDown className="size-4" aria-hidden />
					</Button>
				</CollapsibleTrigger>
				<CollapsibleContent className="pt-3">
					<div className="flex flex-col gap-4">
						<PillInput
							label="Input map (JSON)"
							value={config.inputs}
							onChange={(inputs) =>
								onChange({ ...config, inputs })
							}
							upstreamVars={upstreamVars}
							placeholder='{"Search term": "${previous_step}"}'
							description="Optional overrides keyed by the labels in recorded typing steps."
							mono
							minRows={4}
							readOnly={readOnly}
						/>
						<Field>
							<FieldLabel htmlFor={timeoutId}>
								Wait for success (seconds)
							</FieldLabel>
							<Input
								id={timeoutId}
								aria-describedby={timeoutDescriptionId}
								type="number"
								min={1}
								max={300}
								value={config.timeoutSeconds}
								onChange={(event) =>
									onChange({
										...config,
										timeoutSeconds: event.target.value
											? Number(event.target.value)
											: 30,
									})
								}
								disabled={readOnly}
							/>
							<p
								id={timeoutDescriptionId}
								className="text-muted-foreground text-xs"
							>
								1–300 seconds. The final page is reported if the
								expected page is not reached.
							</p>
						</Field>
					</div>
				</CollapsibleContent>
			</Collapsible>

			<Button
				type="button"
				variant="outline"
				className="w-full"
				onClick={() =>
					window.open(
						"../../browser-automation/dist/",
						"_blank",
						"noopener,noreferrer",
					)
				}
			>
				<ExternalLink className="size-4" aria-hidden />
				Open Playwright workspace
			</Button>
		</div>
	);
}
