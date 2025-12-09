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
import { useNotification } from "@semoss/ui";
import { Badge, Button, Card, Input, Label, Textarea } from "@semoss/ui/next";
import { FlexLayout } from "@/components/flex-layout";
import { useWorkspace } from "@/hooks";
import { MCP_JSON_FILE_NAMES } from "@/pages/app/app.constants";

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
	dataMap: {
		initialData: MCPJsonData;
		onSave?: (data: MCPJsonData, path: string) => void;
		path: string;
	};
};

const TYPE_OPTIONS = [
	{ value: "string", label: "String" },
	{ value: "number", label: "Number" },
	{ value: "boolean", label: "Boolean" },
	{ value: "array", label: "Array" },
	{ value: "object", label: "Object" },
];

// Memoized Function Card Component for performance
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
}>(
	({
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
	}) => {
		const handleHeaderClick = (e: React.MouseEvent) => {
			// Prevent toggle when clicking on delete/restore buttons
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
			<Card
				className={`mb-5 w-full gap-0 rounded-lg py-0 transition-all ${
					isDeleted ? "border-2 border-red-400" : ""
				}`}
			>
				<button
					type="button"
					onClick={handleHeaderClick}
					className={`flex w-full cursor-pointer items-center justify-between p-2 text-left ${isDeleted ? "bg-zinc-100" : "bg-slate-100"} ${isExpanded ? "rounded-t-lg" : "rounded-lg"} transition-colors hover:bg-slate-200`}
				>
					<div className="flex items-center gap-2">
						<div className="rounded p-1">
							{isExpanded ? (
								<ChevronUp
									size={18}
									className="text-gray-600"
								/>
							) : (
								<ChevronDown
									size={18}
									className="text-gray-600"
								/>
							)}
						</div>
						<span
							className={`font-bold text-base ${isDeleted ? "text-gray-500 line-through" : ""}`}
						>
							{tool.title || tool.name}
						</span>
					</div>
					<div className="flex gap-2">
						{!isDeleted ? (
							<Button
								variant="ghost"
								size="sm"
								color="error"
								onClick={(e) => {
									e.stopPropagation();
									onDelete(actualIdx);
								}}
								data-action="delete"
								className="flex items-center gap-1 text-red-600 hover:bg-transparent"
							>
								<Trash2 size={14} />
								<span className="hidden sm:inline">Delete</span>
							</Button>
						) : (
							<Button
								variant="outline"
								size="sm"
								onClick={(e) => {
									e.stopPropagation();
									onRestore(actualIdx);
								}}
								data-action="restore"
								className="flex items-center gap-1 border-green-500 text-green-600 hover:bg-green-50"
							>
								<RotateCcw size={14} />
								<span className="hidden sm:inline">
									Restore
								</span>
							</Button>
						)}
					</div>
				</button>

				{isExpanded && (
					<div className="p-4">
						<div className="mb-3">
							<Label className="mb-1 block text-sm">
								Description:
							</Label>
							<Textarea
								value={tool.description ?? ""}
								onChange={(e) =>
									onUpdateTool(actualIdx, {
										description: e.target.value,
									})
								}
								disabled={isDeleted}
								rows={2}
								style={{ height: "4rem" }}
								className={`w-full resize-y overflow-y-auto px-2 py-1 text-sm ${isDeleted ? "cursor-not-allowed opacity-60" : ""}`}
								placeholder="Describe function purpose and parameters..."
							/>
						</div>

						<div className="w-full overflow-x-auto">
							<div
								className="min-w-full overflow-hidden rounded-lg border border-base-300"
								style={{
									display: "grid",
									gridTemplateColumns:
										"10% 13% 28% 11% 10% 28%",
									fontSize: "0.813rem",
								}}
							>
								{/* Header Row */}
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

								{/* Data Rows */}
								{Object.entries(
									tool.inputSchema.properties,
								).map(([k, p]) => {
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
												<Input
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
													className={`w-full px-1.5 py-1 text-sm ${isDeleted ? "cursor-not-allowed opacity-60" : ""}`}
												/>
											</div>
											<div className="border-gray-200 border-r border-b bg-white px-2 py-2">
												<Textarea
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
													className={`w-full resize-y overflow-y-auto px-1.5 py-1 text-xs ${isDeleted ? "cursor-not-allowed opacity-60" : ""}`}
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
													className={`h-[34px] w-full rounded border bg-white px-1.5 text-sm ${isDeleted ? "cursor-not-allowed opacity-60" : ""}`}
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
														className={`h-4 w-4 rounded border-gray-300 text-blue-600 accent-blue-600 focus:ring-2 focus:ring-blue-500 ${isDeleted ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
													/>
													<span
														className={`text-xs ${isRequired ? "font-semibold text-blue-600" : "text-gray-500"} ${isDeleted ? "opacity-60" : ""}`}
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
													<Textarea
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
														className={`w-full resize-y overflow-y-auto px-1.5 py-1 font-mono text-xs ${hasError ? "border-red-500 focus:border-red-500" : ""} ${isDeleted ? "cursor-not-allowed opacity-60" : ""}`}
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
															className={`h-[34px] w-full rounded border bg-white px-1.5 text-sm ${isDeleted ? "cursor-not-allowed opacity-60" : ""}`}
														>
															<option value="true">
																True
															</option>
															<option value="false">
																False
															</option>
														</select>
													) : (
														<Input
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
															className={`w-full px-1.5 py-1 text-sm ${isDeleted ? "cursor-not-allowed opacity-60" : ""}`}
														/>
													)}
												</div>
											)}
										</React.Fragment>
									);
								})}
							</div>
						</div>
					</div>
				)}
			</Card>
		);
	},
);

FunctionCard.displayName = "FunctionCard";

export const MCPJsonEditor: React.FC<MCPJsonEditorProps> = ({ dataMap }) => {
	const { initialData, onSave, path } = dataMap;
	const { workspace } = useWorkspace();
	const notification = useNotification();

	const activeTabName = path.split("/").pop() + " (UI Editor)";

	// Data state
	const [data, setData] = useState<MCPJsonData>(initialData);
	const [deletedTools, setDeletedTools] = useState<string[]>([]);

	// Search state
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");

	// Expand/Collapse state (only first card expanded by default)
	const [expandedCards, setExpandedCards] = useState<Set<string>>(
		new Set<string>(
			initialData.tools && initialData.tools.length > 0
				? [initialData.tools[0].name]
				: [],
		),
	);
	const [expandAll, setExpandAll] = useState(false);

	// Track raw text for array/object fields
	const [jsonTextValues, setJsonTextValues] = useState<
		Record<string, string>
	>({});

	// Track JSON validation errors for array/object fields
	const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({});

	// Track if data has been modified
	const [hasChanges, setHasChanges] = useState(false);
	const [initialDataSnapshot, setInitialDataSnapshot] = useState<string>(
		JSON.stringify(initialData),
	);

	// Debounce search input with longer delay for better performance
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchQuery);
		}, 400); // Increased from 300ms to 400ms for better performance with large datasets
		return () => clearTimeout(timer);
	}, [searchQuery]);

	// Track changes - only compare actual data, not UI state
	useEffect(() => {
		const currentSnapshot = JSON.stringify(data);
		const isModified =
			currentSnapshot !== initialDataSnapshot || deletedTools.length > 0;
		updatePanels(isModified);
		setHasChanges(isModified);
	}, [data, deletedTools, initialDataSnapshot]);

	// Keyboard shortcut for save (Ctrl+S / Cmd+S)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Check for Ctrl+S (Windows/Linux) or Cmd+S (Mac)
			if ((e.ctrlKey || e.metaKey) && e.key === "s") {
				e.preventDefault(); // Prevent browser's default save dialog
				if (hasChanges) {
					handleSave();
				}
			}
		};

		// Add event listener
		window.addEventListener("keydown", handleKeyDown);

		// Cleanup on unmount
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [hasChanges, data, deletedTools]); // Dependencies needed for handleSave

	const updatePanels = useCallback(
		(isModified: boolean) => {
			try {
				// get the model
				const model = workspace.model;
				if (!model) {
					throw new Error("Missing model");
				}
				// visit the notes, and see if it exists
				model.visitNodes((node) => {
					// check if it is a tabNode
					if (node instanceof FlexLayout.TabNode) {
						// it needs to be a file-editor
						const component = node.getComponent();
						if (component !== "mcpJsonEditor") {
							return;
						}

						// path and space need to match
						const config = node.getConfig();
						if (path !== config.data.path) {
							return;
						}

						const id = node.getId();

						if (isModified) {
							model.doAction(
								FlexLayout.Actions.renameTab(
									id,
									`${activeTabName}*`,
								),
							);
						} else {
							model.doAction(
								FlexLayout.Actions.renameTab(
									id,
									`${activeTabName}`,
								),
							);
						}
					}
				});
			} catch (e) {
				notification.add({
					color: "error",
					message: e,
				});
			}
		},
		[workspace.model, path, activeTabName, notification],
	);

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
					if (i !== toolIdx) {
						return tool;
					}

					const currentRequired = tool.inputSchema.required || [];
					let newRequired: string[];

					if (isRequired) {
						// Add to required array if not already present
						if (!currentRequired.includes(propKey)) {
							newRequired = [...currentRequired, propKey];
						} else {
							newRequired = currentRequired;
						}
					} else {
						// Remove from required array
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

			// Update text value for array/object types
			const textKey = `${toolIdx}-${propKey}`;
			if (newType === "array" || newType === "object") {
				setJsonTextValues((prev) => ({
					...prev,
					[textKey]: JSON.stringify(newDefault, null, 2),
				}));
			} else {
				// Clean up jsonTextValues when switching away from array/object
				setJsonTextValues((prev) => {
					const newValues = { ...prev };
					delete newValues[textKey];
					return newValues;
				});
			}

			// Clear any JSON errors for this field
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
				validDefault = newDefault === "true" || newDefault === "true";
			}
			updateToolProp(toolIdx, propKey, { default: validDefault });
		},
		[updateToolProp],
	);

	// Handle raw text change for array/object types (for typing)
	const handleJsonTextChange = useCallback(
		(toolIdx: number, propKey: string, newText: string) => {
			const textKey = `${toolIdx}-${propKey}`;

			// Update the raw text value immediately (this allows typing to show)
			setJsonTextValues((prev) => ({
				...prev,
				[textKey]: newText,
			}));

			// Try to parse and validate
			try {
				const parsed = JSON.parse(newText);
				updateToolProp(toolIdx, propKey, { default: parsed });
				setJsonErrors((prev) => {
					const newErrors = { ...prev };
					delete newErrors[textKey];
					return newErrors;
				});
			} catch (e) {
				// Show error but allow continued typing
				setJsonErrors((prev) => ({
					...prev,
					[textKey]: e instanceof Error ? e.message : "Invalid JSON",
				}));
			}
		},
		[updateToolProp],
	);

	// Get the display value for array/object textarea
	const getJsonTextValue = useCallback(
		(toolIdx: number, propKey: string, defaultValue: unknown): string => {
			const textKey = `${toolIdx}-${propKey}`;

			// If we have a stored text value, use it
			if (jsonTextValues[textKey] !== undefined) {
				return jsonTextValues[textKey];
			}

			// Otherwise, stringify the default value
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
			// Collapse all
			setExpandedCards(new Set());
			setExpandAll(false);
		} else {
			// Expand all (except deleted ones)
			const allNames = new Set(
				data.tools
					.filter((t) => !deletedTools.includes(t.name))
					.map((t) => t.name),
			);
			setExpandedCards(allNames);
			setExpandAll(true);
		}
	}, [expandAll, data.tools, deletedTools]);

	const removedJsonTabs = useCallback(() => {
		// remove the mcp json and UI tab on mcp generation
		if (workspace.model) {
			MCP_JSON_FILE_NAMES.forEach((fileName) => {
				const tabset = workspace.model
					.getActiveTabset()
					.getChildren()
					.find((tabset) => tabset.getAttr("name") === fileName);
				if (tabset) {
					workspace.model.doAction(
						FlexLayout.Actions.deleteTab(tabset.getId()),
					);
				}
			});
		}
	}, [workspace.model]);

	const handleSave = useCallback(() => {
		if (hasChanges) {
			removedJsonTabs();
			// Filter out deleted tools before saving
			const updatedData = {
				...data,
				tools: data.tools.filter((t) => !deletedTools.includes(t.name)),
			};
			onSave?.(updatedData, path);

			// Update initial snapshot to the saved state
			setInitialDataSnapshot(JSON.stringify(updatedData));

			// Clear deleted tools list after save
			setDeletedTools([]);

			// Update data to reflect the saved state (without deleted tools)
			setData(updatedData);
		} else {
			onSave?.(data, path);
		}

		// Disable save button and remove asterisk from tab
		setHasChanges(false);
		updatePanels(false);
	}, [
		hasChanges,
		data,
		deletedTools,
		onSave,
		path,
		removedJsonTabs,
		updatePanels,
	]);

	// Filter and search logic - Show all tools including deleted ones
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

	// Check if card is expanded
	const isCardExpanded = useCallback(
		(toolName: string) => {
			return expandedCards.has(toolName);
		},
		[expandedCards],
	);

	// Check if card is deleted
	const isCardDeleted = useCallback(
		(toolName: string) => {
			return deletedTools.includes(toolName);
		},
		[deletedTools],
	);

	const headerText = useMemo(() => {
		return `${path.split("/").pop()?.replace(".json", "").toUpperCase()} JSON Editor`;
	}, [path]);

	return (
		<div className="mx-auto w-full max-w-full px-2 py-6 pb-8">
			{/* Page Title */}
			<div className="mb-6 px-4">
				<h2 className="font-bold text-2xl">{headerText}</h2>
			</div>

			{/* Sticky Control Section */}
			<div className="sticky top-0 z-50 mb-6 rounded-lg border border-gray-200 bg-white/95 p-4 backdrop-blur-sm">
				{/* Top Row: Function Count, Actions */}
				<div className="mb-3 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Badge color="info" className="px-2 py-1 text-xs">
							{filteredTools.length}{" "}
							{filteredTools.length === 1
								? "Function"
								: "Functions"}
						</Badge>
						{deletedTools.length > 0 && (
							<Badge color="error" className="px-2 py-1 text-xs">
								{deletedTools.length} Pending Deletion
							</Badge>
						)}
						{debouncedSearch && (
							<span className="text-gray-500 text-xs">
								(filtered)
							</span>
						)}
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={handleExpandAll}
							className="flex items-center gap-1.5"
						>
							{expandAll ? (
								<Minimize2 size={14} />
							) : (
								<Maximize2 size={14} />
							)}
							<span className="hidden sm:inline">
								{expandAll ? "Collapse All" : "Expand All"}
							</span>
						</Button>
						<Button
							size="sm"
							color="primary"
							onClick={handleSave}
							disabled={!hasChanges}
							title="Save (Ctrl+S / Cmd+S)"
							className="flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
						>
							<Save size={14} />
							<span>Save</span>
						</Button>
					</div>
				</div>

				{/* Search Bar */}
				<div className="relative">
					<Search
						className="-translate-y-1/2 absolute top-1/2 left-3 transform text-gray-400"
						size={18}
					/>
					<Input
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search functions by name, title, or description..."
						className="w-full py-2 pr-10 pl-10 text-sm"
					/>
					{searchQuery && (
						<Button
							variant="ghost"
							size="sm"
							onClick={clearSearch}
							className="-translate-y-1/2 absolute top-1/2 right-3 transform text-gray-400 transition-colors hover:text-gray-600"
						>
							<X size={18} />
						</Button>
					)}
				</div>
			</div>

			{/* Meta Data Card - Read Only */}
			<Card className="mb-5 w-full gap-2 rounded-lg bg-zinc-100 p-4">
				<h3 className="mb-3 font-semibold text-base">Meta Data</h3>
				<div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
					{Object.entries(data._meta).map(([key, value]) => (
						<div key={key} className="flex flex-col gap-1">
							<Label
								htmlFor={key}
								className="text-base-muted-foreground text-xm"
							>
								{key}
							</Label>
							<Input
								id={key}
								value={value}
								readOnly
								disabled
								className="w-full cursor-not-allowed border-base-input bg-white px-2 py-1 text-base-muted-foreground text-sm"
							/>
						</div>
					))}
				</div>
			</Card>

			{/* Function Cards */}
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
