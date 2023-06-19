export interface SortedColumn {
    alias: string;
    dir: string;
}

export interface LocalChartOptions {
    headers: string[];
    values: any[];
    keys: any[];
    data: any[];
    columnDef: any[];
    callbacks: any;
    uiOptions: any;
}
