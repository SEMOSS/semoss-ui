import { CellConfig } from '@/stores';
import {
    UppercaseTransformationCell,
    UppercaseTransformationCellDef,
} from './UppercaseTransformationCell';

export const UppercaseTransformationCellConfig: CellConfig<UppercaseTransformationCellDef> =
    {
        name: 'Uppercase',
        widget: 'uppercase-transformation',
        view: UppercaseTransformationCell,
        parameters: {
            frame: '',
            columns: [],
        },
        toPixel: ({ columns, frame }) => {
            const columnNames = columns.map((column) => column.value);
            return `${frame} | ToUpperCase ( columns = ${JSON.stringify(
                columnNames,
            )} ) ;`;
        },
    };
