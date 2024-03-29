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
            transformation: {
                key: 'uppercase',
                parameters: {
                    columns: [],
                },
            },
            targetCell: {
                id: '',
                frameVariableName: '',
            },
        },
        toPixel: ({ transformation, targetCell }) => {
            const columnNames = transformation.parameters.columns.map(
                (column) => column.name,
            );
            return `${
                targetCell.frameVariableName
            } | ToUpperCase ( columns = ${JSON.stringify(columnNames)} ) ;`;
        },
    };
