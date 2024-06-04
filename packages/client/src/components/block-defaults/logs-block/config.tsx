import { BlockConfig } from '@/stores';
import { LogsBlockDef, LogsBlock } from './LogsBlock';
import { HighlightAlt } from '@mui/icons-material';
import { BLOCK_TYPE_LAYOUT } from '../block-defaults.constants';
import { QueryNameDropdownSettings } from '@/components/block-settings/custom/QueryNameDropdownSettings';

export const config: BlockConfig<LogsBlockDef> = {
    widget: 'logs',
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {},
        queryId: '',
    },
    listeners: {},
    slots: {},
    render: LogsBlock,
    icon: HighlightAlt,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Sheet',
                    render: ({ id }) => (
                        <QueryNameDropdownSettings
                            id={id}
                            label="Query"
                            path="queryId"
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [],
};
