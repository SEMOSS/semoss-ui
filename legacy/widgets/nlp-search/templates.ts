enum TEMPLATE_VALUES {
    SINGLE = 'SINGLE',
    MULTIPLE = 'MULTIPLE',
    RANGE = 'RANGE',
}
enum SUGGESTION_TYPE {
    TEMPLATE = 'template',
    SUBCOMPONENT = 'subcomponent',
}
enum TEMPLATE_TYPE {
    SELECT = 'column',
    GROUP = 'group by',
    BASED_ON = 'based on',
    WHERE = 'filter by',
    DISTRIBUTION = 'distribution',
    AGGREGATE_GENERAL = 'aggregate',
    HAVING_GENERAL = 'filter by aggregate',
    SORT_GENERAL = 'sort',
    TOP = 'top',
    BOTTOM = 'bottom',
    EXCLUDE_TOP = 'excluding top',
    EXCLUDE_BOTTOM = 'excluding bottom',
}
const TEMPLATES: any = {
    [TEMPLATE_TYPE.SELECT]: {
        column: TEMPLATE_VALUES.MULTIPLE,
        query: 'select',
        display: '',
        required: ['column'],
        order: ['display', 'column'],
    },
    [TEMPLATE_TYPE.GROUP]: {
        column: TEMPLATE_VALUES.MULTIPLE,
        query: 'group',
        display: 'group by',
        required: ['column'],
        order: ['display', 'column'],
    },
    [TEMPLATE_TYPE.WHERE]: {
        column: TEMPLATE_VALUES.SINGLE,
        operation: TEMPLATE_VALUES.SINGLE,
        value: TEMPLATE_VALUES.MULTIPLE,
        query: 'where',
        display: 'filter by',
        required: ['column', 'operation', 'value'],
        order: ['display', 'column', 'operation', 'value'],
    },
    [TEMPLATE_TYPE.BOTTOM]: {
        column: TEMPLATE_VALUES.SINGLE,
        static_operation: 'bottom',
        value: TEMPLATE_VALUES.SINGLE,
        query: 'position',
        display: false,
        required: ['value', 'column'],
        order: ['static_operation', 'value', 'column'],
    },
    [TEMPLATE_TYPE.TOP]: {
        column: TEMPLATE_VALUES.SINGLE,
        static_operation: 'top',
        value: TEMPLATE_VALUES.SINGLE,
        query: 'position',
        display: false,
        required: ['value', 'column'],
        order: ['static_operation', 'value', 'column'],
    },
    [TEMPLATE_TYPE.EXCLUDE_BOTTOM]: {
        column: TEMPLATE_VALUES.SINGLE,
        static_operation: '- bottom',
        value: TEMPLATE_VALUES.SINGLE,
        query: 'position',
        display: 'excluding bottom',
        required: ['value', 'column'],
        order: ['display', 'value', 'column'],
    },
    [TEMPLATE_TYPE.EXCLUDE_TOP]: {
        column: TEMPLATE_VALUES.SINGLE,
        static_operation: '- top',
        value: TEMPLATE_VALUES.SINGLE,
        query: 'position',
        display: 'excluding top',
        required: ['value', 'column'],
        order: ['display', 'value', 'column'],
    },
    [TEMPLATE_TYPE.DISTRIBUTION]: {
        column: TEMPLATE_VALUES.MULTIPLE,
        query: 'distribution',
        display: 'distribution of',
        required: ['column'],
        order: ['display', 'column'],
    },
    [TEMPLATE_TYPE.AGGREGATE_GENERAL]: {
        column: TEMPLATE_VALUES.SINGLE,
        query: '',
        display: '',
        required: ['column'],
        order: ['display', 'column'],
    },
    [TEMPLATE_TYPE.HAVING_GENERAL]: {
        column: TEMPLATE_VALUES.SINGLE,
        operation: TEMPLATE_VALUES.SINGLE,
        value: TEMPLATE_VALUES.MULTIPLE,
        query: '',
        display: '',
        required: ['column', 'operation', 'value'],
        order: ['display', 'column', 'operation', 'value'],
    },
    [TEMPLATE_TYPE.SORT_GENERAL]: {
        column: TEMPLATE_VALUES.SINGLE,
        query: 'sort',
        display: 'sort',
        operation: TEMPLATE_VALUES.SINGLE,
        required: ['column', 'operation'],
        order: ['display', 'column', 'operation'],
    },
    [TEMPLATE_TYPE.BASED_ON]: {
        column: TEMPLATE_VALUES.SINGLE,
        query: '',
        display: '',
        required: ['column'],
        order: ['display', 'column'],
    },
};
const AGGREGATES: string[] = [
    'average',
    'count',
    'max',
    'min',
    'sum',
    'unique count',
    'stdev',
];
const HAVING: any[] = [
    {
        display: 'filter by average',
        value: 'having average',
    },
    {
        display: 'filter by count',
        value: 'having count',
    },
    {
        display: 'filter by unique count',
        value: 'having unique count',
    },
    {
        display: 'filter by max',
        value: 'having max',
    },
    {
        display: 'filter by min',
        value: 'having min',
    },
    {
        display: 'filter by sum',
        value: 'having sum',
    },
];
const BASED_ON: string[] = [
    'based on average',
    'based on count',
    'based on max',
    'based on min',
    'based on sum',
    'based on unique count',
    'based on stdev',
];

export {
    TEMPLATE_VALUES,
    SUGGESTION_TYPE,
    TEMPLATE_TYPE,
    AGGREGATES,
    TEMPLATES,
    HAVING,
    BASED_ON,
};
