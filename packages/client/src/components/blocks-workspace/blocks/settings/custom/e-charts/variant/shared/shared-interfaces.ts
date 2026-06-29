// Stack | Scatter Interfaces
export interface AxisConfig {
	show: boolean;
	name: string | string[];
	pixelName: string | string[];
	axisTick: {
		show: boolean;
	};
	axisLabel: {
		show: boolean;
		rotate: number;
		fontSize: number;
	};
	nameTextStyle: {
		fontSize: number;
	};
	flipAxisName?: string;
}

// Stored column structure used in chart configuration
export interface StoredColumn {
	name: string;
	label: string;
	values: string[];
	selectors: string[];
	dataType: string[];
}

// Visual map item for chart selection
export interface VisualMapItem {
	title: string;
	option: Record<string, unknown>;
	facet?: Record<string, unknown>;
}
