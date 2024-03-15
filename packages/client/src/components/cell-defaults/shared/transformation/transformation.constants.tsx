import {
    TransformationDef,
    TransformationTypes,
    operation,
    comparator,
    columnTypes,
    dateUnit,
    joinType,
} from './transformation.types';
import {
    FontDownload,
    TableRows,
    ChangeCircleOutlined,
    TodayOutlined,
    DateRangeOutlined,
    JoinInner,
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

export const comparators: comparator[] = ['==', '!='];

export const transformationColumnTypes: columnTypes[] = [
    'STRING',
    'NUMBER',
    'DATE',
];

export const dateUnitTypes: dateUnit[] = ['day', 'week', 'month', 'year'];

export const joinTypes: joinType[] = [
    { name: 'Full Join', code: 'outer.join' },
    { name: 'Inner Join', code: 'inner.join' },
    { name: 'Left Join', code: 'left.outer.join' },
    { name: 'Right Join', code: 'right.outer.join' },
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
    join: {
        transformation: 'join',
        display: 'Join',
        icon: JoinInner,
        widget: 'join-transformation',
    },
};
