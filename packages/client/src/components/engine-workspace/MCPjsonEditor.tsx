import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	EditorHeader,
	FunctionCard,
	type MCPJsonData,
	type MCPTool,
	type MCPToolProperty,
	MetaDataSection,
} from "@semoss/shared";

type MCPJsonEditorProps = {
	dataMap?: {
		initialData?: MCPJsonData;
		onSave?: (data: MCPJsonData, path: string) => void;
		path?: string;
	};
};

export const MCPJsonEditor: React.FC<MCPJsonEditorProps> = (props) => {
	const { dataMap } = props;
	// navigation
	const navigate = useNavigate();

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

	// Debounce search query
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchQuery);
		}, 400);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	// Track changes
	useEffect(() => {
		const currentSnapshot = JSON.stringify(data);
		const isModified =
			currentSnapshot !== initialDataSnapshot || deletedTools.length > 0;
		setHasChanges(isModified);
	}, [data, deletedTools, initialDataSnapshot]);

	// Keyboard shortcut for save (Ctrl+S / Cmd+S)
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

	const handleAddEngineMCPTools = () => {
		navigate(`?addMCPTools=true`);
	};

	return (
		<div className="mx-auto w-full max-w-full overflow-y-auto px-2 py-6 pb-8">
			<div className="mb-6 px-4">
				<h2 className="font-bold text-2xl">{headerText}</h2>
			</div>

			<EditorHeader
				functionCount={filteredTools.length}
				deletedCount={deletedTools.length}
				searchQuery={searchQuery}
				debouncedSearch={debouncedSearch}
				showExpandAll={true}
				showSave={true}
				showSearch={true}
				expandAll={expandAll}
				hasChanges={hasChanges}
				onExpandAll={handleExpandAll}
				onSave={handleSave}
				onSearchChange={setSearchQuery}
				onSearchClear={clearSearch}
				handleAddEngineMCPTools={handleAddEngineMCPTools}
			/>

			<MetaDataSection
				metadata={data._meta}
				title="Meta Data"
				columns={3}
			/>

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
						showDelete={true}
						showRestore={true}
					/>
				);
			})}
		</div>
	);
};
