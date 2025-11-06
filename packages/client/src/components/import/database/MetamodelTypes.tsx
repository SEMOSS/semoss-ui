export interface InputNode {
	id: string;
	type?: string;
	data: {
		name: string;
		properties: Property[];
		description?: string;
	};
	position: { x: number; y: number };
}

export interface InputEdge {
	id: string;
	type: string;
	source: string;
	target: string;
}

export interface InputMeta {
	nodes?: InputNode[];
	edges?: InputEdge[];
}

export interface ParsedResult {
	positions: Record<string, { left: number; top: number }>;
	relation: { relName: string; fromTable: string; toTable: string }[];
	nodeProp: Record<string, string[]>;
	dataTypes?: Record<string, string>;
	additionalDataTypes?: Record<string, string>;
	logicalNames?: Record<string, string[]>;
	description?: Record<string, string>;
}

export interface Property {
	id: string;
	name: string;
	type: string;
	description?: string;
	logicalNames?: string[];
	isPrimary?: boolean;
}
export interface MetaModelTypeProps {
	parsedData?: ParsedResult[];
	onImport?: (parsed: unknown) => void | Promise<void>;
	onCancel: () => void;
}

export type MetamodelNode = {
	id: string;
	type?: string;
	data: {
		name: string;
		properties: Property[];
	};
	position: { x: number; y: number };
	hidden?: boolean;
	description?: string;
	connections?: Edge[];
};

export type Edge = {
	id: string;
	source: string;
	target: string;
	type: string;
};
export type FlowNode = {
	id: string;
	type?: string;
	data: {
		name: string;
		properties: Property[];
		[key: string]: unknown;
	};
	position: { x: number; y: number };
};

export type FlowData = { nodes: (MetamodelNode | FlowNode)[]; edges: Edge[] };

export interface NodeData {
	name?: string;
	properties?: Property[];
	description?: string;
}

export interface MetaNode {
	id: string;
	type?: string;
	data?: NodeData;
	position?: { x?: number; y?: number };
}

export interface RelationItem {
	relName: string;
	fromTable: string;
	toTable: string;
}

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
		result.logicalNames = logicalNames;
	if (Object.keys(description).length > 0) result.description = description;

	return result;
}
