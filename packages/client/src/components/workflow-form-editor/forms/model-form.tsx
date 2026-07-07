import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import {
	Field,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@semoss/ui/next";
import type {
	EngineOption,
	ModelEngineConfig,
	WorkflowNode,
} from "@/pages/workflow/workflow.types";

function EngineSelect({
	label,
	engines,
	value,
	onChange,
}: {
	label: string;
	engines: EngineOption[];
	value: string;
	onChange: (v: string) => void;
}) {
	return (
		<Field>
			<FieldLabel className="text-xs">{label}</FieldLabel>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger className="h-8 text-xs">
					<SelectValue
						placeholder={
							engines.length
								? `Select ${label.toLowerCase()}…`
								: "No engines available"
						}
					/>
				</SelectTrigger>
				<SelectContent>
					{engines.map((e) => (
						<SelectItem
							key={e.engine_id}
							value={e.engine_id}
							className="text-xs"
						>
							{e.engine_display_name ?? e.engine_name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</Field>
	);
}

interface ModelStepFormProps {
	step: WorkflowNode;
	engines: EngineOption[];
	upstreamVars: string[];
	onUpdate: (step: WorkflowNode) => void;
}

export function ModelStepForm({
	step,
	engines,
	upstreamVars,
	onUpdate,
}: ModelStepFormProps) {
	const c = step.config as unknown as ModelEngineConfig;
	const [showAdvanced, setShowAdvanced] = useState(false);
	const update = (patch: Partial<ModelEngineConfig>) =>
		onUpdate({
			...step,
			config: { ...c, ...patch } as unknown as typeof step.config,
		});

	const varHint =
		upstreamVars.length > 0
			? `Use \${${upstreamVars[upstreamVars.length - 1]}} to reference prior step`
			: undefined;

	return (
		<div className="flex flex-col gap-3">
			<EngineSelect
				label="Model Engine"
				engines={engines}
				value={c.engineId ?? ""}
				onChange={(v) => update({ engineId: v })}
			/>
			<Field>
				<FieldLabel className="text-xs">Operation</FieldLabel>
				<Select
					value={c.operation ?? "llm"}
					onValueChange={(v) =>
						update({
							operation: v as ModelEngineConfig["operation"],
						})
					}
				>
					<SelectTrigger className="h-8 text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="llm" className="text-xs">
							Generate text (LLM)
						</SelectItem>
						<SelectItem value="embeddings" className="text-xs">
							Embeddings
						</SelectItem>
						<SelectItem value="vision" className="text-xs">
							Vision
						</SelectItem>
						<SelectItem value="ner" className="text-xs">
							Named Entity Recognition
						</SelectItem>
					</SelectContent>
				</Select>
			</Field>

			{(c.operation ?? "llm") === "llm" && (
				<>
					<Field>
						<FieldLabel className="text-xs">Prompt</FieldLabel>
						<Textarea
							className="min-h-[80px] text-xs"
							value={c.command ?? ""}
							onChange={(e) =>
								update({ command: e.target.value })
							}
							placeholder={varHint ?? "Enter your prompt…"}
							rows={3}
						/>
					</Field>
					<Field>
						<FieldLabel className="text-xs">
							System prompt (optional)
						</FieldLabel>
						<Textarea
							className="min-h-[60px] text-xs"
							value={c.context ?? ""}
							onChange={(e) =>
								update({ context: e.target.value })
							}
							placeholder="You are a helpful assistant…"
							rows={2}
						/>
					</Field>
					<button
						type="button"
						className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
						onClick={() => setShowAdvanced((v) => !v)}
					>
						{showAdvanced ? (
							<ChevronUp className="h-3 w-3" />
						) : (
							<ChevronDown className="h-3 w-3" />
						)}
						Advanced parameters
					</button>
					{showAdvanced && (
						<Field>
							<FieldLabel className="text-xs">
								Param values (JSON)
							</FieldLabel>
							<Textarea
								className="min-h-[60px] font-mono text-xs"
								value={c.paramValues ?? ""}
								onChange={(e) =>
									update({ paramValues: e.target.value })
								}
								placeholder={
									'{"temperature": 0.7, "maxTokens": 1000}'
								}
								rows={2}
							/>
						</Field>
					)}
				</>
			)}

			{c.operation === "embeddings" && (
				<Field>
					<FieldLabel className="text-xs">Text to embed</FieldLabel>
					<Input
						className="h-8 text-xs"
						value={c.values ?? ""}
						onChange={(e) => update({ values: e.target.value })}
						placeholder={varHint ?? "Text or [upstreamVar]"}
					/>
				</Field>
			)}

			{c.operation === "vision" && (
				<>
					<Field>
						<FieldLabel className="text-xs">Prompt</FieldLabel>
						<Input
							className="h-8 text-xs"
							value={c.command ?? ""}
							onChange={(e) =>
								update({ command: e.target.value })
							}
							placeholder="Describe this image…"
						/>
					</Field>
					<Field>
						<FieldLabel className="text-xs">
							Image (URL or base64)
						</FieldLabel>
						<Input
							className="h-8 text-xs"
							value={c.image ?? ""}
							onChange={(e) => update({ image: e.target.value })}
							placeholder={varHint ?? "https://… or [imageVar]"}
						/>
					</Field>
				</>
			)}

			{c.operation === "ner" && (
				<>
					<Field>
						<FieldLabel className="text-xs">
							Text / Prompt
						</FieldLabel>
						<Textarea
							className="min-h-[60px] text-xs"
							value={c.prompt ?? ""}
							onChange={(e) => update({ prompt: e.target.value })}
							placeholder={
								varHint ?? "Text to extract entities from…"
							}
							rows={3}
						/>
					</Field>
					<Field>
						<FieldLabel className="text-xs">
							Entities (comma-separated)
						</FieldLabel>
						<Input
							className="h-8 text-xs"
							value={c.entities ?? ""}
							onChange={(e) =>
								update({ entities: e.target.value })
							}
							placeholder="PERSON, ORG, LOC"
						/>
					</Field>
				</>
			)}
		</div>
	);
}
