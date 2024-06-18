import { BlockConfig } from '@/stores';
import { MermaidBlock, MermaidBlockDef } from './MermaidBlock';
import { BLOCK_TYPE_MERMAID } from '../block-defaults.constants';
import { Schema } from '@mui/icons-material';
import {
    CodeEditorSettings,
    QueryInputSettings,
} from '@/components/block-settings';
import { MermaidBlockMenu } from './MermaidBlockMenu';

export const config: BlockConfig<MermaidBlockDef> = {
    widget: 'mermaid',
    type: BLOCK_TYPE_MERMAID,
    data: {
        text: '',
    },
    listeners: {},
    slots: {},
    render: MermaidBlock,
    icon: Schema,
    menu: MermaidBlockMenu,
};
