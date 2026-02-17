import { useCallback, useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import type { RunToolConfig } from "@/types/workflow";
import { TemplateInput } from "../TemplateInput";

interface UseAppConfigFormProps {
	config: Record<string, unknown>;
	stepId: string;
	onChange: (config: Record<string, unknown>) => void;
}

interface ProjectOption {
	id: string;
	name: string;
	type: string;
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
				title?: string;
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

export function UseAppConfigForm({
	config,
	stepId,
	onChange,
}: UseAppConfigFormProps) {
	const typedConfig = config as unknown as RunToolConfig;
	const [projects, setProjects] = useState<ProjectOption[]>([]);
	const [tools, setTools] = useState<ToolDef[]>([]);
	const [selectedTool, setSelectedTool] = useState<ToolDef | null>(null);
	const [loadingProjects, setLoadingProjects] = useState(false);
	const [loadingTools, setLoadingTools] = useState(false);
	const [toolsError, setToolsError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");

	// ─── Step 1: Fetch projects ─────────────────────────────────
	const fetchProjects = useCallback((filter?: string) => {
		setLoadingProjects(true);

		const filterClause = filter
			? `filterWord=["<encode>${filter}</encode>"], `
			: "";

		runPixel<
			[
				{
					project_id: string;
					project_name: string;
					project_type: string;
				}[],
			]
		>(`MyProjects(${filterClause}limit=[50], offset=[0]);`)
			.then(({ pixelReturn }) => {
				const output = pixelReturn[0]?.output;
				if (Array.isArray(output)) {
					setProjects(
						output.map((p) => ({
							id: p.project_id,
							name: p.project_name,
							type: p.project_type,
						})),
					);
				}
			})
			.catch(() => {
				setProjects([]);
			})
			.finally(() => setLoadingProjects(false));
	}, []);

	// Initial load
	useEffect(() => {
		fetchProjects();
	}, [fetchProjects]);

	// Debounced search
	useEffect(() => {
		if (searchTerm === "") return;
		const timer = setTimeout(() => {
			fetchProjects(searchTerm);
		}, 300);
		return () => clearTimeout(timer);
	}, [searchTerm, fetchProjects]);

	// ─── Step 2: Fetch tools when project changes ───────────────
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
						setToolsError("No tools configured for this app.");
					}
					setTools(output.tools);
				} else {
					setTools([]);
					setToolsError("No tools configured for this app.");
				}
			})
			.catch(() => {
				setTools([]);
				setToolsError("Failed to load tools for this app.");
			})
			.finally(() => setLoadingTools(false));
	}, [typedConfig.engineId]);

	// ─── Step 3: Sync selected tool ─────────────────────────────
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

	// Hide the "engine" param if it has an enum locked to the selected project
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
			{/* Step 1: Search & Select Project */}
			<div className="flex flex-col gap-1">
				<span className="font-medium text-gray-600 text-xs">
					Project / App
				</span>
				<input
					type="text"
					value={searchTerm}
					onChange={(e) => {
						setSearchTerm(e.target.value);
						if (e.target.value === "") {
							fetchProjects();
						}
					}}
					placeholder="Search projects..."
					className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				/>
				{loadingProjects ? (
					<span className="text-gray-400 text-xs">
						Loading projects…
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
						<option value="">Select a project...</option>
						{projects.map((p) => (
							<option key={p.id} value={p.id}>
								{p.name} {p.type ? `(${p.type})` : ""}
							</option>
						))}
					</select>
				)}
				{projects.length === 0 && !loadingProjects && (
					<span className="text-[10px] text-gray-400">
						No projects found.
					</span>
				)}
			</div>

			{/* Step 2: Tool */}
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
										{t.description
											? ` — ${t.description}`
											: ""}
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

			{/* Step 3: Auto-generated param form from inputSchema */}
			{selectedTool && visibleParamEntries.length > 0 && (
				<div className="flex flex-col gap-2">
					<span className="font-semibold text-gray-600 text-xs">
						Parameters
					</span>
					{visibleParamEntries.map(([paramName, paramDef]) => (
						<div key={paramName} className="flex flex-col gap-0.5">
							<span className="font-medium text-[11px] text-gray-500">
								{paramDef.title ?? paramName}
								{requiredParams.has(paramName) && (
									<span className="ml-0.5 text-red-500">
										*
									</span>
								)}
							</span>
							{/* Enum dropdown */}
							{paramDef.enum && paramDef.enum.length > 0 ? (
								<select
									value={
										params[paramName] != null
											? String(params[paramName])
											: ""
									}
									onChange={(e) =>
										onChange({
											params: {
												...params,
												[paramName]: e.target.value,
											},
										})
									}
									className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								>
									<option value="">Select...</option>
									{paramDef.enum.map((val) => (
										<option key={val} value={val}>
											{val}
										</option>
									))}
								</select>
							) : paramDef.type === "boolean" ? (
								/* Boolean toggle */
								<label className="inline-flex cursor-pointer items-center gap-2">
									<input
										type="checkbox"
										checked={params[paramName] === true}
										onChange={(e) =>
											onChange({
												params: {
													...params,
													[paramName]:
														e.target.checked,
												},
											})
										}
										className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
									/>
									<span className="text-gray-500 text-xs">
										{paramDef.description ?? paramName}
									</span>
								</label>
							) : paramDef.type === "integer" ||
								paramDef.type === "number" ? (
								/* Number input */
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
								/* String input with template support */
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
							{paramDef.description &&
								paramDef.type !== "boolean" && (
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
						Project ID auto-filled: {typedConfig.engineId}
					</div>
				)}
		</div>
	);
}
