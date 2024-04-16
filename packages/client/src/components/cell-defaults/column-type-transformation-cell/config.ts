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
            frame: '',
            column: null,
            dataType: null,
        },
        toPixel: ({ frame, column, dataType }) => {
            return `${frame} | ChangeColumnType( column=[${column.value}], dataType=["${dataType.value}"]);`;
        },
    };
