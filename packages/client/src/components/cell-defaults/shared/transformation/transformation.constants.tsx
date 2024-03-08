import {
    TransformationDef,
    TransformationTypes,
    operation,
    columnTypes,
} from './transformation.types';
import {
    FontDownload,
    TableRows,
    ChangeCircleOutlined,
} from '@mui/icons-material';

export const operations: operation[] = [
    '==',
    '<',
    '>',
    '!=',
    '<=',
    '>=',
    '?like',
];

export const transformationColumnTypes: columnTypes[] = [
    'STRING',
    'NUMBER',
    'DATE',
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
    'column-type': {
        transformation: 'column-type',
        display: 'Change Column Type',
        icon: ChangeCircleOutlined,
        widget: 'column-type-transformation',
    },
};
