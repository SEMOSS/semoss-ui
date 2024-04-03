import { CellConfig } from '@/stores';
import {
    EncodeColumnTransformationCellDef,
    EncodeColumnTransformationCell,
} from './EncodeColumnTransformationCell';

// export the config for the block
export const EncodeColumnTransformationCellConfig: CellConfig<EncodeColumnTransformationCellDef> =
    {
        name: 'Encode Column',
        widget: 'encode-column-transformation',
        parameters: {
            transformation: {
                key: 'encode-column',
                parameters: {
                    columns: [],
                },
            },
            targetCell: {
                id: '',
                frameVariableName: '',
            },
        },
        view: EncodeColumnTransformationCell,
        toPixel: ({ transformation, targetCell }) => {
            const columnNames = transformation.parameters.columns.map(
                (column) => column.name,
            );
            return `${
                targetCell.frameVariableName
            } | EncodeColumn ( columns = ${JSON.stringify(columnNames)} ) ;`;
        },
    };
