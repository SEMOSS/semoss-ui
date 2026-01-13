import {
	AlertCircle,
	CheckCircle,
	ChevronDown,
	ChevronUp,
	Maximize2,
	Minimize2,
	RotateCcw,
	Save,
	Search,
	Trash2,
	X,
} from "lucide-react";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";

type MCPToolProperty = {
	title: string;
	description?: string;
	type: string;
	default?: unknown;
};

type MCPTool = {
	name: string;
	title: string;
	description?: string;
	inputSchema: {
		properties: Record<string, MCPToolProperty>;
		required: string[];
		title: string;
		type: "object";
	};
	_type: string;
};

type MCPJsonData = {
	_meta: Record<string, string>;
	tools: MCPTool[];
};

type MCPJsonEditorProps = {
	dataMap?: {
		initialData?: MCPJsonData;
		onSave?: (data: MCPJsonData, path: string) => void;
		path?: string;
	};
};

const TYPE_OPTIONS = [
	{ value: "string", label: "String" },
	{ value: "number", label: "Number" },
	{ value: "boolean", label: "Boolean" },
	{ value: "array", label: "Array" },
	{ value: "object", label: "Object" },
];

const FunctionCard = memo<{
	tool: MCPTool;
	actualIdx: number;
	isExpanded: boolean;
	isDeleted: boolean;
	onToggleExpand: (toolName: string) => void;
	onDelete: (idx: number) => void;
	onRestore: (idx: number) => void;
	onUpdateTool: (index: number, value: Partial<MCPTool>) => void;
	onUpdateToolProp: (
		toolIdx: number,
		propKey: string,
		changes: Partial<MCPToolProperty>,
	) => void;
	onRequiredToggle: (
		toolIdx: number,
		propKey: string,
		isRequired: boolean,
	) => void;
	onTypeChange: (toolIdx: number, propKey: string, newType: string) => void;
	onDefaultChange: (
		toolIdx: number,
		propKey: string,
		newDefault: string,
		propType: string,
	) => void;
	onJsonTextChange: (
		toolIdx: number,
		propKey: string,
		newText: string,
	) => void;
	getJsonTextValue: (
		toolIdx: number,
		propKey: string,
		defaultValue: unknown,
	) => string;
	jsonErrors: Record<string, string>;
}>(function FunctionCard({
	tool,
	actualIdx,
	isExpanded,
	isDeleted,
	onToggleExpand,
	onDelete,
	onRestore,
	onUpdateTool,
	onUpdateToolProp,
	onRequiredToggle,
	onTypeChange,
	onDefaultChange,
	onJsonTextChange,
	getJsonTextValue,
	jsonErrors,
}) {
	const handleHeaderClick = (e: React.MouseEvent) => {
		if (
			(e.target as HTMLElement).closest(
				'button[data-action="delete"], button[data-action="restore"]',
			)
		) {
			return;
		}
		onToggleExpand(tool.name);
	};

	return (
		<div
			className={`mb-5 w-full rounded-lg border bg-white shadow-sm transition-all ${
				isDeleted ? "border-2 border-red-400" : "border-gray-200"
			}`}
		>
			<button
				type="button"
				onClick={handleHeaderClick}
				className={`flex w-full cursor-pointer items-center justify-between p-2 text-left ${
					isDeleted ? "bg-zinc-100" : "bg-slate-100"
				} ${isExpanded ? "rounded-t-lg" : "rounded-lg"} transition-colors hover:bg-slate-200`}
			>
				<div className="flex items-center gap-2">
					<div className="rounded p-1">
						{isExpanded ? (
							<ChevronUp size={18} className="text-gray-600" />
						) : (
							<ChevronDown size={18} className="text-gray-600" />
						)}
					</div>
					<span
						className={`font-bold text-base ${
							isDeleted ? "text-gray-500 line-through" : ""
						}`}
					>
						{tool.title || tool.name}
					</span>
				</div>
				<div className="flex gap-2">
					{!isDeleted ? (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onDelete(actualIdx);
							}}
							data-action="delete"
							className="flex items-center gap-1 rounded px-2 py-1 text-red-600 text-sm transition-colors hover:bg-red-50"
						>
							<Trash2 size={14} />
							<span className="hidden sm:inline">Delete</span>
						</button>
					) : (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onRestore(actualIdx);
							}}
							data-action="restore"
							className="flex items-center gap-1 rounded border border-green-500 px-2 py-1 text-green-600 text-sm transition-colors hover:bg-green-50"
						>
							<RotateCcw size={14} />
							<span className="hidden sm:inline">Restore</span>
						</button>
					)}
				</div>
			</button>

			{isExpanded && (
				<div className="p-4">
					<div className="mb-3">
						<span className="mb-1 block font-medium text-gray-700 text-sm">
							Description:
						</span>
						<textarea
							value={tool.description ?? ""}
							onChange={(e) =>
								onUpdateTool(actualIdx, {
									description: e.target.value,
								})
							}
							disabled={isDeleted}
							rows={2}
							style={{ height: "4rem" }}
							className={`w-full resize-y overflow-y-auto rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
								isDeleted
									? "cursor-not-allowed bg-gray-100 opacity-60"
									: ""
							}`}
							placeholder="Describe function purpose and parameters..."
						/>
					</div>

					<div className="w-full overflow-x-auto">
						<div
							className="min-w-full overflow-hidden rounded-lg border border-base-300"
							style={{
								display: "grid",
								gridTemplateColumns: "10% 13% 28% 11% 10% 28%",
								fontSize: "0.813rem",
							}}
						>
							<div className="flex items-center border-gray-300 border-r border-b bg-zinc-50 px-2 py-2 font-semibold">
								Name
							</div>
							<div className="flex items-center border-gray-300 border-r border-b bg-zinc-50 px-2 py-2 font-semibold">
								Title
							</div>
							<div className="flex items-center border-gray-300 border-r border-b bg-zinc-50 px-2 py-2 font-semibold">
								Description
							</div>
							<div className="flex items-center border-gray-300 border-r border-b bg-zinc-50 px-2 py-2 font-semibold">
								Type
							</div>
							<div className="flex items-center justify-center border-gray-300 border-r border-b bg-zinc-50 px-2 py-2 font-semibold">
								Required
							</div>
							<div className="flex items-center border-gray-300 border-b bg-zinc-50 px-2 py-2 font-semibold">
								Default Value
							</div>

							{Object.entries(tool.inputSchema.properties).map(
								([k, p]) => {
									const textKey = `${actualIdx}-${k}`;
									const hasError = jsonErrors[textKey];
									const isRequired =
										tool.inputSchema.required?.includes(
											k,
										) || false;

									return (
										<React.Fragment key={k}>
											<div className="flex w-full items-center border-gray-200 border-r border-b bg-white px-2 py-2">
												<div className="min-w-0 flex-1">
													<span
														className="block truncate"
														title={k}
													>
														{k}
													</span>
												</div>
											</div>
											<div className="flex items-center border-gray-200 border-r border-b bg-white px-2 py-2">
												<input
													type="text"
													value={p.title}
													onChange={(e) =>
														onUpdateToolProp(
															actualIdx,
															k,
															{
																title: e.target
																	.value,
															},
														)
													}
													disabled={isDeleted}
													className={`w-full rounded border border-gray-300 px-1.5 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
														isDeleted
															? "cursor-not-allowed bg-gray-100 opacity-60"
															: ""
													}`}
												/>
											</div>
											<div className="border-gray-200 border-r border-b bg-white px-2 py-2">
												<textarea
													value={p.description ?? ""}
													onChange={(e) =>
														onUpdateToolProp(
															actualIdx,
															k,
															{
																description:
																	e.target
																		.value,
															},
														)
													}
													disabled={isDeleted}
													rows={2}
													style={{ height: "3rem" }}
													className={`w-full resize-y overflow-y-auto rounded border border-gray-300 px-1.5 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
														isDeleted
															? "cursor-not-allowed bg-gray-100 opacity-60"
															: ""
													}`}
													placeholder="Parameter description..."
												/>
											</div>
											<div className="flex items-center border-gray-200 border-r border-b bg-white px-2 py-2">
												<select
													value={p.type}
													onChange={(e) =>
														onTypeChange(
															actualIdx,
															k,
															e.target.value,
														)
													}
													disabled={isDeleted}
													className={`h-[34px] w-full rounded border bg-white px-1.5 text-sm ${
														isDeleted
															? "cursor-not-allowed opacity-60"
															: ""
													}`}
												>
													{TYPE_OPTIONS.map((opt) => (
														<option
															key={opt.value}
															value={opt.value}
														>
															{opt.label}
														</option>
													))}
												</select>
											</div>
											<div className="flex items-center justify-center border-gray-200 border-r border-b bg-white px-2 py-2">
												<label className="flex cursor-pointer items-center gap-2">
													<input
														type="checkbox"
														checked={isRequired}
														onChange={(e) =>
															onRequiredToggle(
																actualIdx,
																k,
																e.target
																	.checked,
															)
														}
														disabled={isDeleted}
														className={`h-4 w-4 rounded border-gray-300 text-blue-600 accent-blue-600 focus:ring-2 focus:ring-blue-500 ${
															isDeleted
																? "cursor-not-allowed opacity-60"
																: "cursor-pointer"
														}`}
													/>
													<span
														className={`text-xs ${
															isRequired
																? "font-semibold text-blue-600"
																: "text-gray-500"
														} ${
															isDeleted
																? "opacity-60"
																: ""
														}`}
													>
														{isRequired
															? "Required"
															: "Optional"}
													</span>
												</label>
											</div>
											{p.type === "array" ||
											p.type === "object" ? (
												<div className="border-gray-200 border-b bg-white px-2 py-2">
													<textarea
														value={getJsonTextValue(
															actualIdx,
															k,
															p.default,
														)}
														onChange={(e) =>
															onJsonTextChange(
																actualIdx,
																k,
																e.target.value,
															)
														}
														disabled={isDeleted}
														rows={3}
														style={{
															height: "4.5rem",
														}}
														className={`w-full resize-y overflow-y-auto rounded border px-1.5 py-1 font-mono text-xs focus:outline-none focus:ring-1 ${
															hasError
																? "border-red-500 focus:border-red-500 focus:ring-red-500"
																: "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
														} ${
															isDeleted
																? "cursor-not-allowed bg-gray-100 opacity-60"
																: ""
														}`}
														placeholder={
															p.type === "array"
																? '["item1", "item2"]'
																: '{"key": "value"}'
														}
													/>
													{hasError && (
														<div className="mt-1 flex items-start gap-1 text-red-600 text-xs">
															<AlertCircle
																size={12}
																className="mt-0.5 flex-shrink-0"
															/>
															<span>
																{hasError}
															</span>
														</div>
													)}
													{!hasError &&
														p.default !==
															undefined && (
															<div className="mt-1 flex items-center gap-1 text-green-600 text-xs">
																<CheckCircle
																	size={12}
																	className="flex-shrink-0"
																/>
																<span>
																	Valid JSON
																</span>
															</div>
														)}
												</div>
											) : (
												<div className="flex items-center border-gray-200 border-b bg-white px-2 py-2">
													{p.type === "boolean" ? (
														<select
															value={String(
																p.default,
															)}
															onChange={(e) =>
																onDefaultChange(
																	actualIdx,
																	k,
																	e.target
																		.value,
																	p.type,
																)
															}
															disabled={isDeleted}
															className={`h-[34px] w-full rounded border border-gray-300 bg-white px-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
																isDeleted
																	? "cursor-not-allowed bg-gray-100 opacity-60"
																	: ""
															}`}
														>
															<option value="true">
																True
															</option>
															<option value="false">
																False
															</option>
														</select>
													) : (
														<input
															type={
																p.type ===
																"number"
																	? "number"
																	: "text"
															}
															value={String(
																p.default ?? "",
															)}
															onChange={(e) =>
																onDefaultChange(
																	actualIdx,
																	k,
																	e.target
																		.value,
																	p.type,
																)
															}
															disabled={isDeleted}
															className={`w-full rounded border border-gray-300 px-1.5 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
																isDeleted
																	? "cursor-not-allowed bg-gray-100 opacity-60"
																	: ""
															}`}
														/>
													)}
												</div>
											)}
										</React.Fragment>
									);
								},
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
});

FunctionCard.displayName = "FunctionCard";

export const MCPJsonEditor: React.FC<MCPJsonEditorProps> = (props) => {
	const { dataMap } = props;

	const safeInitialData: MCPJsonData =
		dataMap?.initialData ?? ({ _meta: {}, tools: [] } as MCPJsonData);
	const safeOnSave = dataMap?.onSave;
	const safePath = dataMap?.path ?? "";

	const headerText = useMemo(() => {
		if (!safePath) return "MCP JSON Editor";
		const cleanPath = safePath.replace(/#mcp$/, "");
		const fileName = cleanPath.split("/").pop() ?? "";
		const base = fileName.replace(".json", "");
		return `${base.toUpperCase()} JSON Editor`;
	}, [safePath]);

	const [data, setData] = useState<MCPJsonData>(safeInitialData);
	const [deletedTools, setDeletedTools] = useState<string[]>([]);

	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");

	const [expandedCards, setExpandedCards] = useState<Set<string>>(
		new Set<string>(
			safeInitialData.tools && safeInitialData.tools.length > 0
				? [safeInitialData.tools[0].name]
				: [],
		),
	);
	const [expandAll, setExpandAll] = useState(false);

	const [jsonTextValues, setJsonTextValues] = useState<
		Record<string, string>
	>({});

	const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({});

	const [hasChanges, setHasChanges] = useState(false);
	const [initialDataSnapshot, setInitialDataSnapshot] = useState<string>(
		JSON.stringify(safeInitialData),
	);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchQuery);
		}, 400);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	useEffect(() => {
		const currentSnapshot = JSON.stringify(data);
		const isModified =
			currentSnapshot !== initialDataSnapshot || deletedTools.length > 0;
		setHasChanges(isModified);
	}, [data, deletedTools, initialDataSnapshot]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "s") {
				e.preventDefault();
				if (hasChanges) {
					handleSave();
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [hasChanges, data, deletedTools]);

	const updateTool = useCallback((index: number, value: Partial<MCPTool>) => {
		setData((d) => ({
			...d,
			tools: d.tools.map((t, i) =>
				i === index ? { ...t, ...value } : t,
			),
		}));
	}, []);

	const updateToolProp = useCallback(
		(
			toolIdx: number,
			propKey: string,
			changes: Partial<MCPToolProperty>,
		) => {
			setData((d) => ({
				...d,
				tools: d.tools.map((tool, i) =>
					i !== toolIdx
						? tool
						: {
								...tool,
								inputSchema: {
									...tool.inputSchema,
									properties: {
										...tool.inputSchema.properties,
										[propKey]: {
											...tool.inputSchema.properties[
												propKey
											],
											...changes,
										},
									},
								},
							},
				),
			}));
		},
		[],
	);

	const handleRequiredToggle = useCallback(
		(toolIdx: number, propKey: string, isRequired: boolean) => {
			setData((d) => ({
				...d,
				tools: d.tools.map((tool, i) => {
					if (i !== toolIdx) return tool;

					const currentRequired = tool.inputSchema.required || [];
					let newRequired: string[];

					if (isRequired) {
						newRequired = currentRequired.includes(propKey)
							? currentRequired
							: [...currentRequired, propKey];
					} else {
						newRequired = currentRequired.filter(
							(key) => key !== propKey,
						);
					}

					return {
						...tool,
						inputSchema: {
							...tool.inputSchema,
							required: newRequired,
						},
					};
				}),
			}));
		},
		[],
	);

	const handleToolDelete = useCallback(
		(toolIdx: number) => {
			setDeletedTools((prev) => {
				const toolName = data.tools[toolIdx].name;
				return [...prev, toolName];
			});
		},
		[data.tools],
	);

	const handleToolRestore = useCallback(
		(toolIdx: number) => {
			setDeletedTools((prev) =>
				prev.filter((name) => name !== data.tools[toolIdx].name),
			);
		},
		[data.tools],
	);

	const handleTypeChange = useCallback(
		(toolIdx: number, propKey: string, newType: string) => {
			const newDefault =
				newType === "number"
					? 0
					: newType === "boolean"
						? false
						: newType === "array"
							? []
							: newType === "object"
								? {}
								: "";
			updateToolProp(toolIdx, propKey, {
				type: newType,
				default: newDefault,
			});

			const textKey = `${toolIdx}-${propKey}`;
			if (newType === "array" || newType === "object") {
				setJsonTextValues((prev) => ({
					...prev,
					[textKey]: JSON.stringify(newDefault, null, 2),
				}));
			} else {
				setJsonTextValues((prev) => {
					const newValues = { ...prev };
					delete newValues[textKey];
					return newValues;
				});
			}

			setJsonErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[textKey];
				return newErrors;
			});
		},
		[updateToolProp],
	);

	const handleDefaultChange = useCallback(
		(
			toolIdx: number,
			propKey: string,
			newDefault: string,
			propType: string,
		) => {
			let validDefault: string | number | boolean = newDefault;
			if (propType === "number") {
				validDefault = Number(newDefault) || 0;
			} else if (propType === "boolean") {
				validDefault = newDefault === "true";
			}
			updateToolProp(toolIdx, propKey, { default: validDefault });
		},
		[updateToolProp],
	);

	const handleJsonTextChange = useCallback(
		(toolIdx: number, propKey: string, newText: string) => {
			const textKey = `${toolIdx}-${propKey}`;

			setJsonTextValues((prev) => ({
				...prev,
				[textKey]: newText,
			}));

			try {
				const parsed = JSON.parse(newText);
				updateToolProp(toolIdx, propKey, { default: parsed });
				setJsonErrors((prev) => {
					const newErrors = { ...prev };
					delete newErrors[textKey];
					return newErrors;
				});
			} catch (e) {
				setJsonErrors((prev) => ({
					...prev,
					[textKey]: e instanceof Error ? e.message : "Invalid JSON",
				}));
			}
		},
		[updateToolProp],
	);

	const getJsonTextValue = useCallback(
		(toolIdx: number, propKey: string, defaultValue: unknown): string => {
			const textKey = `${toolIdx}-${propKey}`;

			if (jsonTextValues[textKey] !== undefined) {
				return jsonTextValues[textKey];
			}

			try {
				return JSON.stringify(defaultValue, null, 2);
			} catch {
				return "";
			}
		},
		[jsonTextValues],
	);

	const clearSearch = useCallback(() => {
		setSearchQuery("");
		setDebouncedSearch("");
	}, []);

	const toggleCardExpand = useCallback((toolName: string) => {
		setExpandedCards((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(toolName)) {
				newSet.delete(toolName);
			} else {
				newSet.add(toolName);
			}
			return newSet;
		});
	}, []);

	const handleExpandAll = useCallback(() => {
		if (expandAll) {
			setExpandedCards(new Set());
			setExpandAll(false);
		} else {
			const allNames = new Set(
				data.tools
					.filter((t) => !deletedTools.includes(t.name))
					.map((t) => t.name),
			);
			setExpandedCards(allNames);
			setExpandAll(true);
		}
	}, [expandAll, data.tools, deletedTools]);

	const handleSave = useCallback(() => {
		if (!safeOnSave || !safePath) {
			setHasChanges(false);
			return;
		}

		if (hasChanges) {
			const updatedData: MCPJsonData = {
				...data,
				tools: data.tools.filter((t) => !deletedTools.includes(t.name)),
			};
			safeOnSave(updatedData, safePath);
			setInitialDataSnapshot(JSON.stringify(updatedData));
			setDeletedTools([]);
			setData(updatedData);
		} else {
			safeOnSave(data, safePath);
		}

		setHasChanges(false);
	}, [data, deletedTools, hasChanges, safeOnSave, safePath]);

	const visibleTools = useMemo(() => data.tools, [data.tools]);

	const filteredTools = useMemo(() => {
		if (!debouncedSearch.trim()) {
			return visibleTools;
		}
		const query = debouncedSearch.toLowerCase();
		return visibleTools.filter(
			(tool) =>
				tool.name.toLowerCase().includes(query) ||
				tool.title?.toLowerCase().includes(query) ||
				tool.description?.toLowerCase().includes(query),
		);
	}, [visibleTools, debouncedSearch]);

	const isCardExpanded = useCallback(
		(toolName: string) => expandedCards.has(toolName),
		[expandedCards],
	);

	const isCardDeleted = useCallback(
		(toolName: string) => deletedTools.includes(toolName),
		[deletedTools],
	);

	return (
		<div className="mx-auto w-full max-w-full px-2 py-6 pb-8">
			<div className="mb-6 px-4">
				<h2 className="font-bold text-2xl">{headerText}</h2>
			</div>

			<div className="sticky top-0 z-50 mb-6 rounded-lg border border-gray-200 bg-white/95 p-4 shadow-sm backdrop-blur-sm">
				<div className="mb-3 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="rounded-full bg-blue-100 px-2 py-1 font-medium text-blue-700 text-xs">
							{filteredTools.length}{" "}
							{filteredTools.length === 1
								? "Function"
								: "Functions"}
						</span>
						{deletedTools.length > 0 && (
							<span className="rounded-full bg-red-100 px-2 py-1 font-medium text-red-700 text-xs">
								{deletedTools.length} Pending Deletion
							</span>
						)}
						{debouncedSearch && (
							<span className="text-gray-500 text-xs">
								(filtered)
							</span>
						)}
					</div>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={handleExpandAll}
							className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-gray-700 text-sm transition-colors hover:bg-gray-50"
						>
							{expandAll ? (
								<Minimize2 size={14} />
							) : (
								<Maximize2 size={14} />
							)}
							<span className="hidden sm:inline">
								{expandAll ? "Collapse All" : "Expand All"}
							</span>
						</button>
						<button
							type="button"
							onClick={handleSave}
							disabled={!hasChanges || !safeOnSave || !safePath}
							title={
								safeOnSave && safePath
									? "Save (Ctrl+S / Cmd+S)"
									: "Save handler not available"
							}
							className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
						>
							<Save size={14} />
							<span>Save</span>
						</button>
					</div>
				</div>

				<div className="relative">
					<Search
						className="-translate-y-1/2 absolute top-1/2 left-3 transform text-gray-400"
						size={18}
					/>
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search functions by name, title, or description..."
						className="w-full rounded-md border border-gray-300 py-2 pr-10 pl-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					/>
					{searchQuery && (
						<button
							type="button"
							onClick={clearSearch}
							className="-translate-y-1/2 absolute top-1/2 right-3 transform rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
						>
							<X size={18} />
						</button>
					)}
				</div>
			</div>

			<div className="mb-5 w-full rounded-lg border border-gray-200 bg-zinc-100 p-4 shadow-sm">
				<h3 className="mb-3 font-semibold text-base">Meta Data</h3>
				<div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
					{Object.entries(data._meta).map(([key, value]) => (
						<div key={key} className="flex flex-col gap-1">
							<label
								htmlFor={key}
								className="font-medium text-gray-600 text-sm"
							>
								{key}
							</label>
							<input
								type="text"
								id={key}
								value={value}
								readOnly
								disabled
								className="w-full cursor-not-allowed rounded-md border border-gray-300 bg-white px-2 py-1 text-gray-500 text-sm"
							/>
						</div>
					))}
				</div>
			</div>

			{filteredTools.length === 0 && (
				<div className="py-12 text-center text-gray-500">
					<Search className="mx-auto mb-3 text-gray-300" size={48} />
					<p className="text-base">
						{debouncedSearch
							? `No functions found matching "${debouncedSearch}"`
							: "No functions found."}
					</p>
				</div>
			)}

			{filteredTools.map((tool) => {
				const actualIdx = data.tools.findIndex(
					(t) => t.name === tool.name,
				);
				const isExpanded = isCardExpanded(tool.name);
				const isDeleted = isCardDeleted(tool.name);

				return (
					<FunctionCard
						key={tool.name}
						tool={tool}
						actualIdx={actualIdx}
						isExpanded={isExpanded}
						isDeleted={isDeleted}
						onToggleExpand={toggleCardExpand}
						onDelete={handleToolDelete}
						onRestore={handleToolRestore}
						onUpdateTool={updateTool}
						onUpdateToolProp={updateToolProp}
						onRequiredToggle={handleRequiredToggle}
						onTypeChange={handleTypeChange}
						onDefaultChange={handleDefaultChange}
						onJsonTextChange={handleJsonTextChange}
						getJsonTextValue={getJsonTextValue}
						jsonErrors={jsonErrors}
					/>
				);
			})}
		</div>
	);
};
