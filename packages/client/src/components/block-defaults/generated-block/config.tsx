import { BlockConfig } from '@/stores';
import { GeneratedBlockDef, GeneratedBlock } from './GeneratedBlock';
import { Upload } from '@mui/icons-material';
import { BLOCK_TYPE_INPUT } from '../block-defaults.constants';

// export the config for the block
export const config: BlockConfig<GeneratedBlockDef> = {
    widget: 'generated',
    type: BLOCK_TYPE_INPUT,
    data: {
        code: '',
    },
    listeners: {
        // onChange: [],
    },
    slots: {},
    render: GeneratedBlock,
    icon: Upload,
    contentMenu: [],
};
