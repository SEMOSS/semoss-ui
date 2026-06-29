// Shared type definitions for EChart visualization variants

// Axis data item type (supports categorical and numeric data)
export type AxisDataItem = string | number | { value: string | number };

// Chart columns structure
export interface EChartColumns {
	name: string;
	selector: string;
	width: string;
}

// Generic context menu parameters for EChart events
// TData can be customized per chart (e.g., { label: { formatter: string } } for scatter)
export interface EChartContextMenuParams<TData = unknown> {
	data?: TData;
	dataIndex?: number;
	seriesIndex?: number;
	seriesName?: string;
	event: {
		event: MouseEvent;
	};
}

// Generic brush selection interfaces
export interface BrushSelection {
	dataIndex: number[];
}

export interface BrushBatchItem {
	selected: BrushSelection[];
}

export interface BrushSelectedParams {
	batch: BrushBatchItem[];
}

export interface BrushArea {
	coordRange?: [number[], number[]];
}

export interface BrushEndParams {
	areas?: BrushArea[];
	batch?: unknown[];
}
