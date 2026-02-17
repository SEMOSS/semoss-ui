import { useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import type { RunToolConfig } from "@/types/workflow";
import {
	ENGINE_STEP_TYPE_LABELS,
	ENGINE_STEP_TYPES,
	type EngineStepType,
} from "@/types/workflow";
import { TemplateInput } from "../TemplateInput";

interface RunToolConfigFormProps {
	config: Record<string, unknown>;
	stepId: string;
	onChange: (config: Record<string, unknown>) => void;
}

interface EngineOption {
	id: string;
	name: string;
}

interface ToolDef {
	name: string;
	description?: string;
	title?: string;
	inputSchema?: {
		type?: string;
		properties?: Record<
			string,
			{
				type?: string;
				description?: string;
				enum?: string[];
			}
		>;
		required?: string[];
	};
}

interface GetMCPToolsResponse {
	tools: ToolDef[];
	_meta?: {
		SMSS_ENGINE_ID?: string;
		SMSS_ENGINE_NAME?: string;
		SMSS_ENGINE_TYPE?: string;
	};
}

export function RunToolConfigForm({
	config,
	stepId,
	onChange,
}: RunToolConfigFormProps) {
	const typedConfig = config as unknown as RunToolConfig;
	const [engines, setEngines] = useState<EngineOption[]>([]);
	const [tools, setTools] = useState<ToolDef[]>([]);
	const [selectedTool, setSelectedTool] = useState<ToolDef | null>(null);
	const [loadingEngines, setLoadingEngines] = useState(false);
	const [loadingTools, setLoadingTools] = useState(false);
	const [toolsError, setToolsError] = useState<string | null>(null);

	// ─── Step 1 → 2: Fetch engines when engine type changes ─────
	useEffect(() => {
		if (!typedConfig.engineType) {
			setEngines([]);
			return;
		}

		setLoadingEngines(true);
		runPixel<[{ database_id: string; database_name: string }[]]>(
			`MyEngines(engineTypes=["${typedConfig.engineType}"], metaFilters=[{}], userT=[true], limit=[50], offset=[0]);`,
		)
			.then(({ pixelReturn }) => {
				const output = pixelReturn[0]?.output;
				if (Array.isArray(output)) {
					setEngines(
						output.map((e) => ({
							id: e.database_id,
							name: e.database_name,
						})),
					);
				}
			})
			.catch(() => {
				setEngines([]);
			})
			.finally(() => setLoadingEngines(false));
	}, [typedConfig.engineType]);

	// ─── Step 2 → 3: Fetch tools when engine changes ────────────
	useEffect(() => {
		if (!typedConfig.engineId) {
			setTools([]);
			setToolsError(null);
			return;
		}

		setLoadingTools(true);
		setToolsError(null);
		runPixel<[GetMCPToolsResponse]>(
			`GetMCPTools(engine=["${typedConfig.engineId}"]);`,
		)
			.then(({ pixelReturn }) => {
				const output = pixelReturn[0]?.output;
				if (output && Array.isArray(output.tools)) {
					if (output.tools.length === 0) {
						setToolsError(
							"This engine has no tools configured. An admin may need to run MakeEngineMCP first.",
						);
					}
					setTools(output.tools);
				} else {
					setTools([]);
					setToolsError("This engine has no tools configured.");
				}
			})
			.catch(() => {
				setTools([]);
				setToolsError("Failed to load tools for this engine.");
			})
			.finally(() => setLoadingTools(false));
	}, [typedConfig.engineId]);

	// ─── Step 3 → 4: Sync selected tool ─────────────────────────
	useEffect(() => {
		if (typedConfig.toolName && tools.length > 0) {
			const found = tools.find((t) => t.name === typedConfig.toolName);
			setSelectedTool(found ?? null);
		} else {
			setSelectedTool(null);
		}
	}, [typedConfig.toolName, tools]);

	// ─── Determine which params to show ──────────────────────────
	const paramProperties = selectedTool?.inputSchema?.properties ?? {};
	const requiredParams = new Set(selectedTool?.inputSchema?.required ?? []);
	const params = typedConfig.params ?? {};

	// Hide the "engine" param if it has an enum locked to the selected engine
	const visibleParamEntries = Object.entries(paramProperties).filter(
		([paramName, paramDef]) => {
			if (
				paramName === "engine" &&
				paramDef.enum &&
				paramDef.enum.length === 1 &&
				paramDef.enum[0] === typedConfig.engineId
			) {
				return false;
			}
			return true;
		},
	);

	// Auto-fill the engine param when a tool is selected
	const handleToolSelect = (toolName: string) => {
		const tool = tools.find((t) => t.name === toolName);
		const autoParams: Record<string, unknown> = {};

		// Pre-fill the engine param if it exists in the schema
		if (tool?.inputSchema?.properties?.engine) {
			autoParams.engine = typedConfig.engineId;
		}

		onChange({ toolName, params: autoParams });
	};

	return (
		<div className="flex flex-col gap-3">
			{/* Step 1: Engine Type */}
			<div className="flex flex-col gap-1">
				<span className="font-medium text-gray-600 text-xs">
					Engine Type
				</span>
				<select
					value={typedConfig.engineType ?? ""}
					onChange={(e) =>
						onChange({
							engineType: e.target.value,
							engineId: "",
							toolName: "",
							params: {},
						})
					}
					className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				>
					<option value="">Select engine type...</option>
					{ENGINE_STEP_TYPES.map((t) => (
						<option key={t} value={t}>
							{ENGINE_STEP_TYPE_LABELS[t]}
						</option>
					))}
				</select>
			</div>

			{/* Step 2: Engine */}
			{typedConfig.engineType && (
				<div className="flex flex-col gap-1">
					<span className="font-medium text-gray-600 text-xs">
						Engine
					</span>
					{loadingEngines ? (
						<span className="text-gray-400 text-xs">
							Loading engines…
						</span>
					) : (
						<select
							value={typedConfig.engineId ?? ""}
							onChange={(e) =>
								onChange({
									engineId: e.target.value,
									toolName: "",
									params: {},
								})
							}
							className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						>
							<option value="">Select an engine...</option>
							{engines.map((e) => (
								<option key={e.id} value={e.id}>
									{e.name}
								</option>
							))}
						</select>
					)}
					{engines.length === 0 &&
						!loadingEngines &&
						typedConfig.engineType && (
							<span className="text-[10px] text-gray-400">
								No{" "}
								{
									ENGINE_STEP_TYPE_LABELS[
										typedConfig.engineType as EngineStepType
									]
								}{" "}
								engines found.
							</span>
						)}
				</div>
			)}

			{/* Step 3: Tool */}
			{typedConfig.engineId && (
				<div className="flex flex-col gap-1">
					<span className="font-medium text-gray-600 text-xs">
						Tool
					</span>
					{loadingTools ? (
						<span className="text-gray-400 text-xs">
							Loading tools…
						</span>
					) : (
						<>
							<select
								value={typedConfig.toolName ?? ""}
								onChange={(e) =>
									handleToolSelect(e.target.value)
								}
								className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							>
								<option value="">Select a tool...</option>
								{tools.map((t) => (
									<option key={t.name} value={t.name}>
										{t.title ?? t.name}
									</option>
								))}
							</select>
							{toolsError && (
								<span className="text-[10px] text-amber-600">
									{toolsError}
								</span>
							)}
						</>
					)}
					{selectedTool?.description && (
						<span className="text-[10px] text-gray-400">
							{selectedTool.description}
						</span>
					)}
				</div>
			)}

			{/* Step 4: Auto-generated param form from inputSchema */}
			{selectedTool && visibleParamEntries.length > 0 && (
				<div className="flex flex-col gap-2">
					<span className="font-semibold text-gray-600 text-xs">
						Parameters
					</span>
					{visibleParamEntries.map(([paramName, paramDef]) => (
						<div key={paramName} className="flex flex-col gap-0.5">
							<span className="font-medium text-[11px] text-gray-500">
								{paramName}
								{requiredParams.has(paramName) && (
									<span className="ml-0.5 text-red-500">
										*
									</span>
								)}
							</span>
							{paramDef.type === "integer" ||
							paramDef.type === "number" ? (
								<input
									type="number"
									value={
										params[paramName] != null
											? Number(params[paramName])
											: ""
									}
									onChange={(e) =>
										onChange({
											params: {
												...params,
												[paramName]:
													e.target.value === ""
														? undefined
														: Number(
																e.target.value,
															),
											},
										})
									}
									placeholder={
										paramDef.description ?? paramName
									}
									className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								/>
							) : (
								<TemplateInput
									value={
										typeof params[paramName] === "string"
											? (params[paramName] as string)
											: params[paramName] != null
												? JSON.stringify(
														params[paramName],
													)
												: ""
									}
									onChange={(v) =>
										onChange({
											params: {
												...params,
												[paramName]: v,
											},
										})
									}
									stepId={stepId}
									placeholder={
										paramDef.description ?? paramName
									}
								/>
							)}
							{paramDef.description && (
								<span className="text-[10px] text-gray-400">
									{paramDef.description}
								</span>
							)}
						</div>
					))}
				</div>
			)}

			{/* Hidden engine param indicator */}
			{selectedTool &&
				paramProperties.engine &&
				!visibleParamEntries.some(([k]) => k === "engine") && (
					<div className="rounded-md bg-gray-50 px-3 py-1.5 text-[10px] text-gray-400">
						Engine ID auto-filled: {typedConfig.engineId}
					</div>
				)}
		</div>
	);
}
