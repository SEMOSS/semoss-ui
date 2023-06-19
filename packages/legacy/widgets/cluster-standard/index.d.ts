import { SimulationNodeDatum } from 'd3-force';

export interface Size {
    width: number;
    height: number;
}

export interface AspectRatio {
    horizontal: number;
    vertical: number;
}

export interface Group {
    [key: string]: any;
    data: CircleDatum[];
    i: number;
}

export interface DataTableAlign {
    [tooltip: string]: string;
    cluster: string;
    label: string;
}

export interface ClusterData {
    dataTableAlign: DataTableAlign;
    labelData: object[];
    rawData: object[];
    uiOptions: object;
    viewData: object[];
    viewHeaders: string[];
}

export interface ClusterStandardState {
    clusterData: ClusterData;
    columns: number;
    forceX: any;
    forceY: any;
    groupCategories: string[];
    groupingCategory: string;
    groups: CircleGroupDatum[];
    groupSqrt: number;
    maxGroupLength: number;
    rows: number;
    spaceMultiplier: number;
}

export interface CircleDatum extends SimulationNodeDatum {
    actualX: number;
    actualY: number;
}

export interface CircleGroupDatum extends Group, SimulationNodeDatum {}
