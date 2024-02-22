import { UpdateRowTransformationDef } from '../../update-row-transformation-cell';
import { UppercaseTransformationDef } from '../../uppercase-transformation-cell';
import {
    TransformationDef,
    TransformationTypes,
    operation,
} from './transformation.types';
import { FontDownload, TableRows } from '@mui/icons-material';

export const operations: operation[] = [
    '==',
    '<',
    '>',
    '!=',
    '<=',
    '>=',
    '?like',
];

export interface TransformationConfig<
    D extends TransformationDef = TransformationDef,
> {
    key: D['key'];
    parameters: D['parameters'];
}

export const Transformations: Record<
    TransformationTypes,
    {
        transformation: TransformationTypes;
        display: string;
        icon: React.FunctionComponent;
        widget: string;
    }
> = {
    uppercase: {
        transformation: 'uppercase',
        display: 'Uppercase',
        icon: FontDownload,
        widget: 'uppercase-transformation',
    },
    'update-row': {
        transformation: 'update-row',
        display: 'Update Row Values',
        icon: TableRows,
        widget: 'update-row-transformation',
    },
};
