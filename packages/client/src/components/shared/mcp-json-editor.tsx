import { Search } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	EditorHeader,
	FunctionCard,
	type MCPJsonData,
	type MCPTool,
	type MCPToolProperty,
} from "@semoss/shared";
import { Card, Input, Label } from "@semoss/ui/next";

type MCPJsonEditorProps = {
	dataMap: {
		initialData: MCPJsonData;
		onSave?: (data: MCPJsonData, path: string) => void;
		path: string;
		name: string;
	};
};

// Custom hooks remain unchanged...
const useDebounce = <T,>(value: T, delay: number = 400): T => {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => clearTimeout(timer);
	}, [value, delay]);

	return debouncedValue;
};

const useJsonValidation = () => {
	const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({});

	const validateJson = useCallback((key: string, value: string) => {
		try {
			JSON.parse(value);
			setJsonErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[key];
				return newErrors;
			});
			return { valid: true };
		} catch (e) {
			const errorMsg = e instanceof Error ? e.message : "Invalid JSON";
			setJsonErrors((prev) => ({
				...prev,
				[key]: errorMsg,
			}));
			return { valid: false, error: errorMsg };
		}
	}, []);

	const clearError = useCallback((key: string) => {
		setJsonErrors((prev) => {
			const newErrors = { ...prev };
			delete newErrors[key];
			return newErrors;
		});
	}, []);

	return { jsonErrors, validateJson, clearError };
};

const useKeyboardShortcut = (
	key: string,
	callback: () => void,
	deps: unknown[] = [],
) => {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === key) {
				e.preventDefault();
				callback();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [key, callback, ...deps]);
};

export const MCPJsonEditor: React.FC<MCPJsonEditorProps> = ({ dataMap }) => {
	const { initialData, onSave, path } = dataMap;

	const [data, setData] = useState<MCPJsonData>(initialData);
	const [deletedTools, setDeletedTools] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [expandedCards, setExpandedCards] = useState<Set<string>>(
		new Set<string>(
			initialData.tools && initialData.tools.length > 0
				? [initialData.tools[0].name]
				: [],
		),
	);
	const [expandAll, setExpandAll] = useState(false);
	const [jsonTextValues, setJsonTextValues] = useState<
		Record<string, string>
	>({});
	const [hasChanges, setHasChanges] = useState(false);
	const [initialDataSnapshot, setInitialDataSnapshot] = useState<string>(
		JSON.stringify(initialData),
	);

	const debouncedSearch = useDebounce(searchQuery, 400);
	const { jsonErrors, validateJson, clearError } = useJsonValidation();

	useEffect(() => {
		const currentSnapshot = JSON.stringify(data);
		const isModified =
			currentSnapshot !== initialDataSnapshot || deletedTools.length > 0;
		setHasChanges(isModified);
	}, [data, deletedTools, initialDataSnapshot]);

	useKeyboardShortcut("s", () => {
		if (hasChanges) {
			handleSave();
		}
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
					if (i !== toolIdx) {
						return tool;
					}

					const currentRequired = tool.inputSchema.required || [];
					let newRequired: string[];

					if (isRequired) {
						if (!currentRequired.includes(propKey)) {
							newRequired = [...currentRequired, propKey];
						} else {
							newRequired = currentRequired;
						}
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

			clearError(textKey);
		},
		[updateToolProp, clearError],
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

			const result = validateJson(textKey, newText);
			if (result.valid) {
				try {
					const parsed = JSON.parse(newText);
					updateToolProp(toolIdx, propKey, { default: parsed });
				} catch {
					// Should not happen as validateJson already checked
				}
			}
		},
		[updateToolProp, validateJson],
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
		if (hasChanges) {
			const updatedData = {
				...data,
				tools: data.tools.filter((t) => !deletedTools.includes(t.name)),
			};
			onSave?.(updatedData, path);

			setInitialDataSnapshot(JSON.stringify(updatedData));
			setDeletedTools([]);
			setData(updatedData);
		} else {
			onSave?.(data, path);
		}

		setHasChanges(false);
		// updatePanels(false);
	}, [
		hasChanges,
		data,
		deletedTools,
		onSave,
		path,
	]);

	const visibleTools = useMemo(() => data.tools || [], [data.tools]);

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
		(toolName: string) => {
			return expandedCards.has(toolName);
		},
		[expandedCards],
	);

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
		<div className="container-padding-x mx-auto w-full max-w-full py-3">
			<div className="mb-6">
				<h2 className="heading-md">{headerText}</h2>
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
			/>

			<Card className="mb-5 w-full rounded-lg bg-secondary p-4">
				<h3 className="font-semibold text-base text-foreground">
					Meta Data
				</h3>
				<div
					className="grid w-full gap-3"
					style={{
						gridTemplateColumns: `repeat(3, 1fr)`,
					}}
				>
					{Object.entries(data._meta).map(([key, value]) => (
						<div key={key} className="flex flex-col gap-1">
							<Label
								htmlFor={key}
								className="text-muted-foreground text-sm"
							>
								{key}
							</Label>
							<Input
								id={key}
								value={value}
								readOnly
								disabled
								className="w-full cursor-not-allowed border-input bg-muted px-2 py-1 text-muted-foreground text-sm"
							/>
						</div>
					))}
				</div>
			</Card>

			{filteredTools.length === 0 && (
				<div className="py-12 text-center">
					<Search
						className="mx-auto mb-3 text-muted-foreground"
						size={48}
					/>
					<p className="text-base text-muted-foreground">
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
