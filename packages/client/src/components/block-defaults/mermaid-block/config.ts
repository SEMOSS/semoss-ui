import { BlockConfig } from '@/stores';
import { MermaidBlock, MermaidBlockDef } from './MermaidBlock';
import { BLOCK_TYPE_MERMAID } from '../block-defaults.constants';
import { Construction } from '@mui/icons-material';

export const config: BlockConfig<MermaidBlockDef> = {
    widget: 'mermaid',
    type: BLOCK_TYPE_MERMAID,
    data: {
        string: '',
    },
    listeners: {},
    slots: {},
    render: MermaidBlock,
    icon: Construction,
    contentMenu: [
        {
            name: 'Mermaid',
            children: [],
        },
    ],
};
