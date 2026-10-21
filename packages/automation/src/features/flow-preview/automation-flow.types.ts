/** Display-only projection of the server-owned workflow definition. */
export interface AutomationFlow {
	nodes: Array<{
		id: string;
		type: string;
		label: string;
		position?: { x: number; y: number };
	}>;
	edges: Array<{
		source: string;
		target: string;
		sourcePort: string;
		targetPort: string;
	}>;
}
