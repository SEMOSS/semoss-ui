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
            transformation: {
                key: 'collapse',
                parameters: {
                    columns: [],
                    value: null,
                    delimiter: null,
                    maintainColumns: [],
                },
            },
            targetCell: {
                id: '',
                frameVariableName: '',
            },
        },
        view: CollapseTransformationCell,
        toPixel: ({ transformation, targetCell }) => {
            const columnNames = transformation.parameters.columns.map(
                (column) => column.name,
            );
            const valueName = transformation.parameters.value.name;
            const delimiterName = transformation.parameters.delimiter;
            const maintainColNames =
                transformation.parameters.maintainColumns.map(
                    (column) => column.name,
                );
            return `${targetCell.frameVariableName} | 
        Convert(frameType=[R]).as(["${targetCell.frameVariableName}"]) | 
        Collapse(groupByColumn=${JSON.stringify(columnNames)}, 
            value=["${valueName}"], 
            delimiter=["${delimiterName}"], 
            maintainCols=${JSON.stringify(maintainColNames)});`;
        },
    };
