import { CellConfig } from '@/stores';
import {
    CollapseTransformationCell,
    CollapseTransformationCellDef,
} from './CollapseTransformationCell';

// export the config for the block
export const CollapseTransformationCellConfig: CellConfig<CollapseTransformationCellDef> =
    {
        name: 'Collapse',
        widget: 'collapse-transformation',
        parameters: {
            frame: '',
            groupByColumn: [],
            value: null,
            delimiter: null,
            maintainCols: [],
        },
        view: CollapseTransformationCell,
        toPixel: ({ frame, groupByColumn, value, delimiter, maintainCols }) => {
            const columnNames = groupByColumn.map((column) => column.value);
            const valueName = value.value;
            const delimiterName = delimiter;
            const maintainColNames = maintainCols.map((column) => column.value);
            return `${frame} |
        Collapse(groupByColumn=${JSON.stringify(columnNames)}, 
            value=["${valueName}"], 
            delimiter=["${delimiterName}"], 
            maintainCols=${JSON.stringify(maintainColNames)});`;
        },
    };
