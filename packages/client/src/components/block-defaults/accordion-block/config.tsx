import { BlockConfig } from '@/stores';
import { Schema } from '@mui/icons-material';
import { BLOCK_TYPE_LAYOUT } from '../block-defaults.constants';
import { AccordionBlock, AccordionBlockDef } from './AccordionBlock';

export const config: BlockConfig<AccordionBlockDef> = {
    widget: 'accordion',
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {
            display: 'flex',
            flexDirection: 'column',
            padding: '4px',
            gap: '8px',
        },
    },
    listeners: {},
    slots: {
        header: [],
        content: [],
    },
    render: AccordionBlock,
    icon: Schema,
    contentMenu: [],
    styleMenu: [],
};
