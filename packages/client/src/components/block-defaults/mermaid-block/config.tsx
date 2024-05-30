import { BlockConfig } from '@/stores';
import { MermaidBlock, MermaidBlockDef } from './MermaidBlock';
import { BLOCK_TYPE_MERMAID } from '../block-defaults.constants';
import { Schema } from '@mui/icons-material';
import { QueryInputSettings } from '@/components/block-settings';

export const config: BlockConfig<MermaidBlockDef> = {
    widget: 'mermaid',
    type: BLOCK_TYPE_MERMAID,
    data: {
        text: 'Query',
    },
    listeners: {},
    slots: {},
    render: MermaidBlock,
    icon: Schema,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Query',
                    render: ({ id }) => (
                        <QueryInputSettings id={id} label="Query" path="text" />
                    ),
                },
            ],
        },
    ],
};
