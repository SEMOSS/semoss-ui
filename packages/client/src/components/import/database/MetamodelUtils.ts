import type { MetamodelNodeType } from "@/components/metamodel";
import type {
	ColumnOption,
	Edge,
	FlowData,
	FlowNode,
	InputMeta,
	MetamodelNode,
	MetaNode,
	ParsedResult,
	Property,
	RelationItem,
} from "./MetamodelTypes";

/**
 * Attaches connection information to nodes based on edges
 * @param nodesInput - Array of nodes (MetamodelNode or FlowNode)
 * @param edgesInput - Array of edges connecting the nodes
 * @returns Array of nodes with connections attached
 */
export const attachConnectionsToNodes = (
	nodesInput: (MetamodelNode | FlowNode)[],
	edgesInput: Edge[],
): (MetamodelNode & { connections?: Edge[] })[] => {
	return (nodesInput ?? []).map((n) => {
		const nodeId = n.id;
		const nodeConnections = (edgesInput ?? []).filter(
			(e) => e.source === nodeId || e.target === nodeId,
		);
		return {
			...n,
			connections: nodeConnections.map((e) => ({ ...e })),
		} as MetamodelNode & { connections?: Edge[] };
	});
};

/**
 * Creates a unique edge ID from source and target node IDs
 * @param sourceId - Source node ID
 * @param targetId - Target node ID
 * @returns Generated edge ID with spaces replaced by underscores
 */
export const makeEdgeIdFromNodeIds = (
	sourceId: string,
	targetId: string,
): string => {
	return `${sourceId}_${targetId}`?.replace(/\s+/g, "_");
};

/**
 * Gets a unique key for a data source
 * @param data - Data object containing fileName or fileLocation
 * @param index - Index of the data source
 * @returns Unique key for the data source
 */
export const getDataSourceKey = (
	data: { fileName?: string; fileLocation?: string },
	index: number,
): string => {
	return data?.fileName || data?.fileLocation || `datasource-${index}`;
};

/**
 * Extracts display name from data object
 * @param data - Data object containing fileLocation
 * @returns Display name extracted from file path or "Unnamed"
 */
export const getDisplayName = (data: { fileLocation?: string }): string => {
	if (data?.fileLocation) {
		const parts = data.fileLocation.split("/");
		const lastPart = parts[parts.length - 1];
		return lastPart || "Unnamed";
	}
	return "Unnamed";
};

/**
 * Generates nodes from parsed data
 * @param parsed - Parsed data containing positions, properties, and data types
 * @returns Array of MetamodelNode or FlowNode objects
 */
export const generateNodesFromParsed = (parsed: {
	positions?: Record<string, { left: number; top: number }>;
	nodeProp?: Record<string, string[]>;
	dataTypes?: Record<string, string>;
	additionalDataTypes?: Record<string, string>;
}): (MetamodelNode | FlowNode)[] => {
	if (!parsed?.positions) return [];

	return Object.keys(parsed.positions).map((nodeName) => {
		const position = parsed.positions[nodeName];
		const isIndexNode = nodeName.toLowerCase() === "index";

		const extraProps = parsed.nodeProp?.[nodeName] ?? [];
		const propertiesList = isIndexNode
			? extraProps
			: [nodeName, ...extraProps];

		return {
			id: nodeName,
			type: "metamodel",
			data: {
				name: nodeName?.replace(/_/g, " "),
				properties: propertiesList.map((prop, idx) => ({
					id: `${nodeName}__${prop}`,
					name: prop?.replace(/_/g, " "),
					type:
						parsed.dataTypes?.[prop] ??
						parsed.additionalDataTypes?.[prop] ??
						"",
					isPrimary: idx === 0,
					label: prop?.replace(/_/g, " "),
				})),
			},
			position: {
				x: position.left,
				y: position.top,
			},
		};
	});
};

/**
 * Generates edges from parsed data
 * @param parsed - Parsed data containing relation information
 * @returns Array of Edge objects
 */
export const generateEdgesFromParsed = (parsed: {
	relation?: Array<{
		relName: string;
		fromTable: string;
		toTable: string;
	}>;
}): Edge[] => {
	if (!parsed?.relation) return [];
	return parsed.relation.map((rel) => ({
		id: rel.relName,
		type: "floating",
		source: rel.fromTable,
		target: rel.toTable,
	}));
};

/**
 * Gets initial connections from edges and nodes
 * @param edges - Array of edges
 * @param nodes - Array of nodes
 * @returns Array of connection objects with parent and child table names
 */
export const getInitialConnections = (
	edges: Edge[],
	nodes: (MetamodelNode | FlowNode)[],
): Array<{ id: string; parentTable: string; childTable: string }> => {
	return edges.map((e) => {
		const sourceNode = nodes.find((n) => n.id === e.source);
		const targetNode = nodes.find((n) => n.id === e.target);
		const parentTable = sourceNode?.data?.name ?? e.source;
		const childTable = targetNode?.data?.name ?? e.target;
		return {
			id: e.id,
			parentTable,
			childTable,
		};
	});
};

/**
 * Creates a new edge object
 * @param sourceId - Source node ID
 * @param targetId - Target node ID
 * @returns New Edge object
 */
export const createEdge = (sourceId: string, targetId: string): Edge => {
	return {
		id: makeEdgeIdFromNodeIds(sourceId, targetId),
		source: sourceId,
		target: targetId,
		type: "floating",
	};
};

/**
 * Checks if an edge already exists
 * @param edges - Array of existing edges
 * @param sourceId - Source node ID
 * @param targetId - Target node ID
 * @returns True if edge exists, false otherwise
 */
export const edgeExists = (
	edges: Edge[],
	sourceId: string,
	targetId: string,
): boolean => {
	const edgeId = makeEdgeIdFromNodeIds(sourceId, targetId);
	return edges.some((e) => e.id === edgeId);
};

/**
 * Finds a node by name or ID
 * @param nodes - Array of nodes to search
 * @param identifier - Node name or ID to find
 * @returns Found node or undefined
 */
export const findNodeByNameOrId = (
	nodes: (MetamodelNode | FlowNode)[],
	identifier: string,
): (MetamodelNode | FlowNode) | undefined => {
	return nodes.find(
		(n) => n.data?.name === identifier || n.id === identifier,
	);
};

/**
 * Removes edges connected to a specific node
 * @param edges - Array of edges
 * @param nodeId - Node ID to remove connections from
 * @returns Filtered array of edges
 */
export const removeEdgesForNode = (edges: Edge[], nodeId: string): Edge[] => {
	return edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
};

/**
 * Deep clones an object using JSON parse/stringify
 * @param obj - Object to clone
 * @returns Cloned object
 */
export const deepClone = <T>(obj: T): T => {
	try {
		return JSON.parse(JSON.stringify(obj));
	} catch {
		return obj;
	}
};

/**
 * Rebuilds nodes from original parsed data
 * @param parsed - Original parsed data
 * @returns Array of rebuilt nodes
 */
export const rebuildNodesFromParsed = (parsed: {
	positions?: Record<string, { left: number; top: number }>;
	nodeProp?: Record<string, string[]>;
	dataTypes?: Record<string, string>;
	additionalDataTypes?: Record<string, string>;
}): (MetamodelNode | FlowNode)[] => {
	if (!parsed?.positions) return [];

	return Object.keys(parsed.positions).map((nodeName) => {
		const position = parsed.positions[nodeName];
		const isIndexNode = nodeName.toLowerCase() === "index";
		const extraProps = parsed.nodeProp?.[nodeName] ?? [];
		const propertiesList = isIndexNode
			? extraProps
			: [nodeName, ...extraProps];

		return {
			id: nodeName,
			type: "metamodel",
			data: {
				name: nodeName?.replace(/_/g, " "),
				properties: propertiesList.map((prop, idx) => ({
					id: `${nodeName}__${prop}`,
					name: prop?.replace(/_/g, " "),
					type:
						parsed.dataTypes?.[prop] ??
						parsed.additionalDataTypes?.[prop] ??
						"",
					isPrimary: idx === 0,
					label: prop?.replace(/_/g, " "),
				})),
			},
			position: {
				x: position.left,
				y: position.top,
			},
		};
	});
};

/**
 * Creates payload array from parsed data and flow states
 * @param parsedData - Array of original parsed data
 * @param flowStates - Record of flow states by index
 * @param transformMetaToParsed - Function to transform flow data to parsed format
 * @returns Array of ParsedResult payloads
 */
export const createPayloadsFromFlowStates = (
	parsedData: ParsedResult[],
	flowStates: Record<number, FlowData>,
	transformMetaToParsed: (flow) => ParsedResult | null,
): ParsedResult[] => {
	const payloads: ParsedResult[] = [];

	(parsedData || []).forEach((originalData, index) => {
		const dataFlow = flowStates[index];
		let currentData = originalData;

		if (dataFlow && Object.keys(dataFlow).length > 0) {
			const payload = transformMetaToParsed(dataFlow);
			currentData = payload || originalData;
		}

		const individualPayload: ParsedResult = {
			positions: currentData.positions || {},
			relation: currentData.relation || [],
			nodeProp: currentData.nodeProp || {},
			dataTypes: currentData.dataTypes || {},
			additionalDataTypes: currentData.additionalDataTypes || {},
			descriptionMap: currentData.descriptionMap || {},
			logicalNamesMap: currentData.logicalNamesMap || {},
		};

		payloads.push(individualPayload);
	});

	return payloads;
};

export function getPrimaryProp(props?: Property[]): Property | null {
	if (!Array.isArray(props)) return null;
	const found = props.find((p) => Boolean(p?.isPrimary));
	return found ?? null;
}

export function getNonPrimaryProps<T extends Property>(props?: T[]): T[] {
	if (!Array.isArray(props)) return [];
	return props.filter((p) => !p?.isPrimary);
}

export function defineName(node: MetaNode): string {
	const props: Property[] = Array.isArray(node.data?.properties)
		? node.data.properties
		: [];

	const primary = getPrimaryProp(props);

	if (primary && typeof primary.name === "string" && primary.name.trim()) {
		if (!node.data) {
			node.data = { name: primary.name };
		} else {
			node.data.name = primary.name;
		}
		return primary.name;
	}

	if (typeof node.data?.name === "string" && node.data.name.trim()) {
		return node.data.name;
	}

	return node.id;
}

export function transformMetaToParsed(input: InputMeta): ParsedResult {
	const nodes: MetaNode[] = input.nodes ?? [];
	const edges: Edge[] = input.edges ?? [];

	const positions: Record<string, { left: number; top: number }> = {};
	const relation: RelationItem[] = [];
	const nodeProp: Record<string, string[]> = {};
	const dataTypes: Record<string, string> = {};
	const additionalDataTypes: Record<string, string> = {};
	const logicalNames: Record<string, string[]> = {};
	const description: Record<string, string> = {};

	const idToEffectiveName: Record<string, string> = {};

	for (const node of nodes) {
		const nodeId = node.id;
		const pos = node.position ?? { x: 0, y: 0 };
		positions[nodeId] = {
			left: Number(pos.x) || 0,
			top: Number(pos.y) || 0,
		};

		const props: Property[] = Array.isArray(node.data?.properties)
			? node.data.properties
			: [];

		const effectiveName = defineName(node);
		idToEffectiveName[nodeId] = effectiveName;

		const nonPrimary = getNonPrimaryProps(props);
		nodeProp[effectiveName] =
			nonPrimary.length > 0 ? nonPrimary.map((p) => p.name) : [];

		if (
			typeof node.data?.description === "string" &&
			node.data.description.trim().length > 0
		) {
			description[effectiveName] = node.data.description;
		}

		for (const prop of props) {
			const colName = prop.name;

			if (typeof prop.type === "string" && !(colName in dataTypes)) {
				dataTypes[colName] = prop.type;
			} else if (
				typeof prop.type === "string" &&
				colName in dataTypes &&
				dataTypes[colName] !== prop.type
			) {
				additionalDataTypes[`${effectiveName}%${colName}`] = prop.type;
			}

			if (
				typeof prop.description === "string" &&
				prop.description.trim()
			) {
				description[`${effectiveName}%${colName}`] = prop.description;
			}

			if (
				Array.isArray(prop.logicalNames) &&
				prop.logicalNames.length > 0
			) {
				if (!Array.isArray(logicalNames[effectiveName])) {
					logicalNames[effectiveName] = [];
				}
				for (const ln of prop.logicalNames) {
					if (
						typeof ln === "string" &&
						ln.trim().length > 0 &&
						!logicalNames[effectiveName].includes(ln)
					) {
						logicalNames[effectiveName].push(ln);
					}
				}
			}
		}
	}

	for (const e of edges) {
		relation.push({
			relName: e.id,
			fromTable: idToEffectiveName[e.source] ?? e.source,
			toTable: idToEffectiveName[e.target] ?? e.target,
		});
	}

	const result: ParsedResult = {
		positions,
		relation,
		nodeProp,
	};

	if (Object.keys(dataTypes).length > 0) result.dataTypes = dataTypes;
	if (Object.keys(additionalDataTypes).length > 0)
		result.additionalDataTypes = additionalDataTypes;
	if (Object.keys(logicalNames).length > 0)
		result.logicalNamesMap = logicalNames;
	if (Object.keys(description).length > 0)
		result.descriptionMap = description;

	return result;
}

/**
 * Extracts all unique column names from all nodes
 * @param nodes - Array of nodes to extract columns from
 * @returns Array of unique ColumnOption objects with id, name, and label
 */
export const getAllColumnNamesFromNodes = (
	nodes: (MetamodelNode | FlowNode)[],
): ColumnOption[] => {
	const result: ColumnOption[] = [];
	const seen = new Set<string>();

	if (!Array.isArray(nodes)) return result;

	for (const n of nodes) {
		const props = n?.data?.properties || [];
		for (const p of props) {
			const id = p?.id;
			const displayName = p?.name;

			// Skip if both id and displayName are missing
			if (!displayName && !id) continue;

			// Use id as the unique key, fallback to displayName
			const key = id ?? displayName;

			if (!seen.has(key)) {
				seen.add(key);
				result.push({
					id,
					name: displayName,
					label: displayName,
				});
			}
		}
	}

	return result;
};
/**
 * Compares two arrays of nodes by their IDs
 * @param a - First array of nodes
 * @param b - Second array of nodes
 * @returns True if node IDs are equal, false otherwise
 */
export const nodeIdsEqual = (
	a: MetamodelNodeType[] = [],
	b: MetamodelNodeType[] = [],
): boolean => {
	if (!Array.isArray(a) || !Array.isArray(b)) return false;
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i].id !== b[i].id) return false;
	}
	return true;
};

/**
 * Compares two arrays of edges by their IDs
 * @param a - First array of edges
 * @param b - Second array of edges
 * @returns True if edge IDs are equal, false otherwise
 */
export const edgeIdsEqual = (a: Edge[] = [], b: Edge[] = []): boolean => {
	if (!Array.isArray(a) || !Array.isArray(b)) return false;
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (
			(a[i].id || `${a[i].source}_${a[i].target}`) !==
			(b[i].id || `${b[i].source}_${b[i].target}`)
		) {
			return false;
		}
	}
	return true;
};

/**
 * Updates properties for a column in a node
 * @param oldProps - Existing properties array
 * @param columnId - ID of the column to update
 * @param updates - Updates to apply (name, type, description, logicalNames)
 * @returns Updated properties array or null if no changes
 */
export const updateColumnProperties = (
	oldProps: Property[],
	columnId: string,
	updates: {
		name?: string;
		type?: string;
		description?: string;
		logicalNames?: string[];
	},
): Property[] | null => {
	let targetIdx = oldProps.findIndex((p) => p.id === columnId);
	if (targetIdx === -1) {
		targetIdx = oldProps.findIndex((p) => p.name === columnId);
	}
	if (targetIdx === -1) return null;

	const targetProp = oldProps[targetIdx];
	const oldName = targetProp.name;
	const newName = (updates.name ?? "").trim();
	const newType = updates.type ?? "";
	const newDescription = updates.description;
	const newLogicalNames = Array.isArray(updates.logicalNames)
		? updates.logicalNames
		: [""];

	const nameUnchanged = !newName || newName === oldName;
	const typeUnchanged = newType === null || newType === targetProp.type;
	const descUnchanged =
		newDescription === null || newDescription === targetProp.description;
	const logicalNamesUnchanged =
		newLogicalNames === null ||
		JSON.stringify(newLogicalNames) ===
			JSON.stringify(targetProp.logicalNames || []);

	if (
		nameUnchanged &&
		typeUnchanged &&
		descUnchanged &&
		logicalNamesUnchanged
	) {
		return null;
	}

	const updatedProps = oldProps.map((p, idx) =>
		idx === targetIdx
			? {
					...p,
					name: newName || p.name,
					type: newType ?? p.type,
					description:
						newDescription !== null
							? newDescription
							: p.description,
					logicalNames:
						newLogicalNames !== null
							? newLogicalNames
							: p.logicalNames,
				}
			: p,
	);

	const dupIdx = updatedProps.findIndex(
		(p, idx) =>
			idx !== targetIdx && p.name === updatedProps[targetIdx].name,
	);

	return dupIdx !== -1
		? updatedProps.filter((_, idx) => idx !== dupIdx)
		: updatedProps;
};

/**
 * Creates new properties for a node based on column names
 * @param nodeId - ID of the node
 * @param names - Array of column names
 * @param existingProps - Existing properties of the node
 * @param availableColumnNames - Available column options
 * @param chosenType - Default type for new columns
 * @returns Array of new properties
 */
export const createPropertiesFromNames = (
	nodeId: string,
	names: string[],
	existingProps: Property[],
	availableColumnNames: ColumnOption[],
	chosenType: string = "varchar",
): Property[] => {
	const existingPropsByLabel = new Map(
		existingProps.map((p) => [p.label, p]),
	);
	const existingPropsByName = new Map(existingProps.map((p) => [p.name, p]));

	return names.map((nm) => {
		let existing = existingPropsByLabel.get(nm);

		if (!existing) {
			existing = existingPropsByName.get(nm);
		}

		if (existing) {
			return { ...existing };
		}

		const matchedAvailable =
			Array.isArray(availableColumnNames) &&
			availableColumnNames.find(
				(c) => c.name === nm || c.id === nm || c.label === nm,
			);

		let newId =
			matchedAvailable?.id ?? `${nodeId}.${nm.replace(/\s+/g, "_")}`;

		if (existingProps.some((p) => p.id === newId)) {
			newId = `${newId}_${Date.now()}`;
		}

		return { id: newId, name: nm, type: chosenType, label: nm };
	});
};
