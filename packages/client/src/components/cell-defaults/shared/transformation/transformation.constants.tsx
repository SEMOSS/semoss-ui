import {
    TransformationDef,
    TransformationTypes,
    operation,
    columnTypes,
    dateUnit,
} from './transformation.types';
import {
    FontDownload,
    TableRows,
    ChangeCircleOutlined,
    TodayOutlined,
    DateRangeOutlined,
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

export const dateUnitTypes: dateUnit[] = ['day', 'week', 'month', 'year'];

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
    'date-difference': {
        transformation: 'date-difference',
        display: 'Date Difference',
        icon: DateRangeOutlined,
        widget: 'date-difference-transformation',
    },
    timestamp: {
        transformation: 'timestamp',
        display: 'Timestamp',
        icon: TodayOutlined,
        widget: 'timestamp-transformation',
    },
};
