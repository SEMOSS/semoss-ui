import { CellConfig } from '@/stores';
import {
    CumulativeSumTransformationCell,
    CumulativeSumTransformationCellDef,
} from './CumulativeSumTransformationCell';

// export the config for the block
export const CumulativeSumTransformationCellConfig: CellConfig<CumulativeSumTransformationCellDef> =
    {
        name: 'Cumulative Sum',
        widget: 'cumulative-sum-transformation',
        parameters: {
            frame: '',
            newColumn: '',
            valueColumn: null,
            sortColumns: [],
            groupByColumns: [],
        },
        view: CumulativeSumTransformationCell,
        toPixel: ({
            frame,
            newColumn,
            valueColumn,
            sortColumns,
            groupByColumns,
        }) => {
            const sortColumnsValues = sortColumns.map((column) => column.value);
            const groupByColumnsValues = groupByColumns.map(
                (column) => column.value,
            );

            return `${frame} | 
            CumulativeSum(newCol=["${newColumn}"], 
                value=["${valueColumn.value}"],
                sortCols=${JSON.stringify(sortColumnsValues)},
                groupByCols=${JSON.stringify(groupByColumnsValues)});`;
        },
    };
