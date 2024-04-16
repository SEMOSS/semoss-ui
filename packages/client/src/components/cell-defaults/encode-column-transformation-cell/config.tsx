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
            frame: '',
            columns: [],
        },
        view: EncodeColumnTransformationCell,
        toPixel: ({ frame, columns }) => {
            const columnNames = columns.map((column) => column.value);
            return `${frame} | EncodeColumn ( columns = ${JSON.stringify(
                columnNames,
            )} ) ;`;
        },
    };
