interface InputNode {
	id: string;
	type?: string;
	data: {
		name: string;
		properties: Property[];
		description?: string;
	};
	position: { x: number; y: number };
}

interface InputEdge {
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
	relation: {
		relName: string;
		fromTable: string;
		toTable: string;
		toCol?: string;
		fromCol?: string;
	}[];
	nodeProp: Record<string, string[]>;
	dataTypes?: Record<string, string>;
	additionalDataTypes?: Record<string, string>;
	logicalNamesMap?: Record<string, string[]>;
	descriptionMap?: Record<string, string>;
	fileName?: string;
	fileLocation?: string;
	raw_type?: string[];
	physicalTypes?: Record<string, string>;
}

export interface Property {
	id: string;
	name: string;
	type: string;
	description?: string;
	logicalNames?: string[];
	isPrimary?: boolean;
	label?: string;
	rawType?: string;
}
export interface MetaModelTypeProps {
	parsedData?: ParsedResult[];
	onImport?: (parsed: unknown) => void | Promise<void>;
	onCancel: () => void;
	onImportConnections?: (connections: unknown) => void | Promise<void>;
	isRdf?: boolean;
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
	type?: string;
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

interface NodeData {
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

export interface ColumnOption {
	id: string;
	name: string;
	label: string;
}
