import {
    TransformationDef,
    TransformationTypes,
    operation,
    columnTypes,
    dateUnit,
    comparator,
    joinType,
    //
    dataTypes,
} from './transformation.types';
import {
    FontDownload,
    TableRows,
    ChangeCircleOutlined,
    TodayOutlined,
    DateRangeOutlined,
    CloseFullscreenOutlined,
    AddTaskOutlined,
    VpnKey,
    JoinInner,
} from '@mui/icons-material';

export const transformationColumnTypes2: {
    type: string;
    value: dataTypes;
}[] = [
    {
        type: '',
        value: 'STRING',
    },
    {
        type: '',
        value: 'NUMBER',
    },
    {
        type: '',
        value: 'DATE',
    },
];

// ----
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

export const joinTypes: joinType[] = [
    { name: 'Full Join', code: 'outer.join' },
    { name: 'Inner Join', code: 'inner.join' },
    { name: 'Left Join', code: 'left.outer.join' },
    { name: 'Right Join', code: 'right.outer.join' },
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
        display: string;
        icon: React.FunctionComponent;
        transformation?: TransformationTypes;
        widget?: string;
    }
> = {
    'uppercase-transformation': {
        // X
        display: 'Uppercase',
        icon: FontDownload,
    },
    'column-type-transformation': {
        // X
        display: 'Change Column Type',
        icon: ChangeCircleOutlined,
    },
    'encode-column-transformation': {
        // X
        display: 'Encode Column',
        icon: VpnKey,
    },
    'timestamp-transformation': {
        display: 'Timestamp',
        icon: TodayOutlined,
    },
    //
    'cumulative-sum': {
        display: 'Cumulative Sum',
        icon: AddTaskOutlined,
    },
    'update-row': {
        transformation: 'update-row',
        display: 'Update Row Values',
        icon: TableRows,
        widget: 'update-row-transformation',
    },
    'date-difference': {
        transformation: 'date-difference',
        display: 'Date Difference',
        icon: DateRangeOutlined,
        widget: 'date-difference-transformation',
    },
    collapse: {
        transformation: 'collapse',
        display: 'Collapse',
        icon: CloseFullscreenOutlined,
        widget: 'collapse-transformation',
    },
    join: {
        transformation: 'join',
        display: 'Join',
        icon: JoinInner,
        widget: 'join-transformation',
    },
};
