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
            transformation: {
                key: 'cumulative-sum',
                parameters: {
                    newColumn: '',
                    valueColumn: null,
                    sortColumns: [],
                    groupByColumns: [],
                },
            },
            targetCell: {
                id: '',
                frameVariableName: '',
            },
        },
        view: CumulativeSumTransformationCell,
        toPixel: ({ transformation, targetCell }) => {
            const sortColumns = transformation.parameters.sortColumns.map(
                (column) => column.name,
            );
            const groupByColumns = transformation.parameters.groupByColumns.map(
                (column) => column.name,
            );

            return `${targetCell.frameVariableName} | 
            Convert(frameType=[R]).as(["${targetCell.frameVariableName}"]) | 
            CumulativeSum(newCol=["${transformation.parameters.newColumn}"], 
                value=["${transformation.parameters.valueColumn.name}"],
                sortCols=${JSON.stringify(sortColumns)},
                groupByCols=${JSON.stringify(groupByColumns)});`;
        },
    };
