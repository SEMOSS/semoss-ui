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
            columns: [],
            frame: '',
        },
        toPixel: ({ columns, frame }) => {
            const columnNames = columns.map((column) => column.name);
            return `${frame} | ToUpperCase ( columns = ${JSON.stringify(
                columnNames,
            )} ) ;`;
        },
    };
