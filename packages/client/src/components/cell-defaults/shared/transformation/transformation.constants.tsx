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
        // X
        display: 'Timestamp',
        icon: TodayOutlined,
    },
    'cumulative-sum-transformation': {
        display: 'Cumulative Sum',
        icon: AddTaskOutlined,
    },
    'update-row-transformation': {
        // X - Needs Testing
        display: 'Update Row Values',
        icon: TableRows,
    },
    'date-difference-transformation': {
        display: 'Date Difference',
        icon: DateRangeOutlined,
    },
    //
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
