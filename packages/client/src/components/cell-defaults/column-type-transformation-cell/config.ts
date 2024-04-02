import { CellConfig } from '@/stores';
import {
    ColumnTypeTransformationCell,
    ColumnTypeTransformationCellDef,
} from './ColumnTypeTransformationCell';

export const ColumnTypeTransformationCellConfig: CellConfig<ColumnTypeTransformationCellDef> =
    {
        name: 'Change Column Type',
        widget: 'column-type-transformation',
        view: ColumnTypeTransformationCell,
        parameters: {
            transformation: {
                key: 'column-type',
                parameters: {
                    column: null,
                    columnType: null,
                },
            },
            targetCell: {
                id: '',
                frameVariableName: '',
            },
        },
        toPixel: ({ transformation, targetCell }) => {
            return `${targetCell.frameVariableName} | ChangeColumnType( column=[${transformation.parameters.column?.name}], dataType=["${transformation.parameters.columnType}"]);`;
        },
    };
