import { useCallback, useMemo, useRef, useState } from "react";
import {
	cloneTool,
	createEmptyProperty,
	createTool,
	createToolId,
	deriveToolType,
	ENUM_TYPE_VALUE,
	type NewToolInput,
	normalizeTool,
	renameProperty,
	snapshotOf,
	toEditorTools,
	toSavedTools,
	uniqueName,
} from "./mcp-json-utils";
import type {
	EditorTool,
	MCPJsonData,
	MCPTool,
	MCPToolProperty,
} from "./types";

const withProperty = (
	tool: MCPTool,
	propKey: string,
	property: MCPToolProperty,
): MCPTool => ({
	...tool,
	inputSchema: {
		...tool.inputSchema,
		properties: { ...tool.inputSchema.properties, [propKey]: property },
	},
});

/**
 * Owns every mutation the form surface can make. Tools are addressed by their
 * editor id rather than their name, so renames and duplicates can never cross
 * wires with each other.
 */
export const useMCPEditor = (
	initialData: MCPJsonData,
	path: string,
	initialExtraKeys: Record<string, unknown> = {},
) => {
	// Built once so the tool list and the initial selection agree on ids.
	const seedRef = useRef<EditorTool[] | null>(null);
	if (seedRef.current === null) {
		seedRef.current = toEditorTools(initialData.tools);
	}

	const [fileMeta, setFileMeta] = useState<Record<string, string>>(
		() => initialData._meta ?? {},
	);
	const [tools, setTools] = useState<EditorTool[]>(seedRef.current);
	const [selectedId, setSelectedId] = useState<string | null>(
		seedRef.current[0]?.id ?? null,
	);
	// Compared against the normalized tools, not the raw file, so a file that
	// simply omits an optional key does not read as unsaved the moment it loads.
	const [savedSnapshot, setSavedSnapshot] = useState<string>(() =>
		snapshotOf(
			initialData._meta ?? {},
			(seedRef.current ?? []).map((entry) => entry.tool),
		),
	);

	/**
	 * Top-level keys the editor does not model. Preserved verbatim so saving
	 * never silently drops something the backend put in the file.
	 */
	const extraFileKeysRef = useRef<Record<string, unknown>>(initialExtraKeys);

	const savedTools = useMemo(() => toSavedTools(tools), [tools]);

	const currentSnapshot = useMemo(
		() => snapshotOf(fileMeta, savedTools),
		[fileMeta, savedTools],
	);

	const hasChanges = currentSnapshot !== savedSnapshot;

	/** The file exactly as it would be written right now. */
	const buildFileData = useCallback(
		(): MCPJsonData =>
			({
				...extraFileKeysRef.current,
				_meta: fileMeta,
				tools: savedTools,
			}) as MCPJsonData,
		[fileMeta, savedTools],
	);

	const toolType = useMemo(
		() => deriveToolType(savedTools, path),
		[savedTools, path],
	);

	const takenNames = useMemo(
		() => new Set(tools.map((entry) => entry.tool.name)),
		[tools],
	);

	const mutateTool = useCallback(
		(id: string, mutate: (tool: MCPTool) => MCPTool) => {
			setTools((prev) =>
				prev.map((entry) =>
					entry.id === id
						? { ...entry, tool: mutate(entry.tool) }
						: entry,
				),
			);
		},
		[],
	);

	const updateTool = useCallback(
		(id: string, changes: Partial<MCPTool>) => {
			mutateTool(id, (tool) => ({ ...tool, ...changes }));
		},
		[mutateTool],
	);

	const updateProperty = useCallback(
		(id: string, propKey: string, changes: Partial<MCPToolProperty>) => {
			mutateTool(id, (tool) =>
				withProperty(tool, propKey, {
					...tool.inputSchema.properties[propKey],
					...changes,
				}),
			);
		},
		[mutateTool],
	);

	const addProperty = useCallback(
		(id: string, propKey: string, type: string) => {
			mutateTool(id, (tool) =>
				withProperty(tool, propKey, createEmptyProperty(type)),
			);
		},
		[mutateTool],
	);

	const deleteProperty = useCallback(
		(id: string, propKey: string) => {
			mutateTool(id, (tool) => {
				const nextProperties = { ...tool.inputSchema.properties };
				delete nextProperties[propKey];
				return {
					...tool,
					inputSchema: {
						...tool.inputSchema,
						properties: nextProperties,
						required: tool.inputSchema.required.filter(
							(key) => key !== propKey,
						),
					},
				};
			});
		},
		[mutateTool],
	);

	const renamePropertyKey = useCallback(
		(id: string, oldKey: string, newKey: string) => {
			if (oldKey === newKey) return;
			mutateTool(id, (tool) => ({
				...tool,
				inputSchema: {
					...tool.inputSchema,
					properties: renameProperty(
						tool.inputSchema.properties,
						oldKey,
						newKey,
					),
					required: tool.inputSchema.required.map((key) =>
						key === oldKey ? newKey : key,
					),
				},
			}));
		},
		[mutateTool],
	);

	const toggleRequired = useCallback(
		(id: string, propKey: string, required: boolean) => {
			mutateTool(id, (tool) => {
				const current = tool.inputSchema.required;
				const next = required
					? current.includes(propKey)
						? current
						: [...current, propKey]
					: current.filter((key) => key !== propKey);
				return {
					...tool,
					inputSchema: { ...tool.inputSchema, required: next },
				};
			});
		},
		[mutateTool],
	);

	const changePropertyType = useCallback(
		(id: string, propKey: string, newType: string) => {
			mutateTool(id, (tool) => {
				const property = tool.inputSchema.properties[propKey] ?? {
					type: "string",
				};

				if (newType === ENUM_TYPE_VALUE) {
					const currentEnum = Array.isArray(property.enum)
						? property.enum
						: [];
					// Only keep the default if it is still one of the allowed
					// values; otherwise the parameter is left with none.
					const keepsDefault = currentEnum.some(
						(option) => option === property.default,
					);

					return withProperty(tool, propKey, {
						...property,
						type: "string",
						default: keepsDefault ? property.default : undefined,
						enum: currentEnum,
					});
				}

				// A default from the previous type is meaningless under the new
				// one, so it is dropped rather than coerced into a placeholder.
				const next: MCPToolProperty = {
					...property,
					type: newType,
					default: undefined,
				};
				delete next.enum;
				return withProperty(tool, propKey, next);
			});
		},
		[mutateTool],
	);

	const addTool = useCallback(
		(input: NewToolInput) => {
			const id = createToolId();
			setTools((prev) => [
				...prev,
				{
					id,
					tool: normalizeTool(createTool({ ...input, toolType })),
					isNew: true,
					isDeleted: false,
				},
			]);
			setSelectedId(id);
			return id;
		},
		[toolType],
	);

	const duplicateTool = useCallback((id: string) => {
		const newId = createToolId();

		setTools((prev) => {
			const index = prev.findIndex((entry) => entry.id === id);
			if (index === -1) return prev;

			const source = prev[index].tool;
			const taken = new Set(prev.map((entry) => entry.tool.name));
			const copy = cloneTool(source);
			copy.name = uniqueName(`${source.name}_copy`, taken);
			copy.title = source.title ? `${source.title} (copy)` : copy.name;

			const next = [...prev];
			next.splice(index + 1, 0, {
				id: newId,
				tool: copy,
				isNew: true,
				isDeleted: false,
			});
			return next;
		});

		setSelectedId(newId);
	}, []);

	/**
	 * Tools added this session vanish outright; tools that already exist on
	 * disk are only marked, so the removal stays reversible until save.
	 */
	const deleteTool = useCallback(
		(id: string) => {
			setTools((prev) => {
				const entry = prev.find((item) => item.id === id);
				if (!entry) return prev;
				if (entry.isNew) return prev.filter((item) => item.id !== id);
				return prev.map((item) =>
					item.id === id ? { ...item, isDeleted: true } : item,
				);
			});

			setSelectedId((current) => {
				if (current !== id) return current;
				const remaining = tools.filter(
					(item) => item.id !== id && !item.isDeleted,
				);
				return remaining[0]?.id ?? null;
			});
		},
		[tools],
	);

	const restoreTool = useCallback((id: string) => {
		setTools((prev) =>
			prev.map((entry) =>
				entry.id === id ? { ...entry, isDeleted: false } : entry,
			),
		);
	}, []);

	/** Replaces everything and treats the result as the new saved baseline. */
	const resetFrom = useCallback(
		(data: MCPJsonData, extraKeys: Record<string, unknown> = {}) => {
			const nextTools = toEditorTools(data.tools);
			extraFileKeysRef.current = extraKeys;
			setFileMeta(data._meta ?? {});
			setTools(nextTools);
			setSelectedId(nextTools[0]?.id ?? null);
			setSavedSnapshot(
				snapshotOf(
					data._meta ?? {},
					nextTools.map((entry) => entry.tool),
				),
			);
		},
		[],
	);

	/**
	 * Adopts new content but leaves it flagged as unsaved. Used while the raw
	 * JSON surface is being edited, so the selection is re-anchored by position
	 * rather than by id (every adopt mints fresh ids).
	 */
	const adoptFrom = useCallback(
		(
			data: MCPJsonData,
			extraKeys: Record<string, unknown> = {},
			preferIndex = 0,
		) => {
			const nextTools = toEditorTools(data.tools);
			extraFileKeysRef.current = extraKeys;
			setFileMeta(data._meta ?? {});
			setTools(nextTools);
			const clamped = Math.min(
				Math.max(preferIndex, 0),
				Math.max(nextTools.length - 1, 0),
			);
			setSelectedId(nextTools[clamped]?.id ?? null);
		},
		[],
	);

	const selectedIndex = useMemo(
		() => tools.findIndex((entry) => entry.id === selectedId),
		[tools, selectedId],
	);

	const markSaved = useCallback(() => {
		setTools((prev) =>
			prev
				.filter((entry) => !entry.isDeleted)
				.map((entry) => ({ ...entry, isNew: false })),
		);
		setSavedSnapshot(snapshotOf(fileMeta, savedTools));
	}, [fileMeta, savedTools]);

	const selectedTool = useMemo(
		() => tools.find((entry) => entry.id === selectedId) ?? null,
		[tools, selectedId],
	);

	const deletedCount = useMemo(
		() => tools.filter((entry) => entry.isDeleted).length,
		[tools],
	);

	return {
		fileMeta,
		tools,
		savedTools,
		selectedId,
		selectedIndex,
		selectedTool,
		setSelectedId,
		hasChanges,
		deletedCount,
		takenNames,
		toolType,
		buildFileData,
		updateTool,
		updateProperty,
		addProperty,
		deleteProperty,
		renamePropertyKey,
		toggleRequired,
		changePropertyType,
		addTool,
		duplicateTool,
		deleteTool,
		restoreTool,
		resetFrom,
		adoptFrom,
		markSaved,
	};
};

export type MCPEditorController = ReturnType<typeof useMCPEditor>;
