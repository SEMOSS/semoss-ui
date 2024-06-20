import { BlockConfig } from '@/stores';
import { HTMLBlockDef, HTMLBlock } from './HTMLBlock';
import { Code } from '@mui/icons-material';
import { BLOCK_TYPE_DISPLAY } from '../block-defaults.constants';
// no longer using this it can be deleted
// import { CodeEditorInput } from '@/components/block-settings/shared/CodeEditorInput';
import { HTMLBlockMenu } from './HTMLBlockMenu';

// export the config for the block
export const config: BlockConfig<HTMLBlockDef> = {
    widget: 'html',
    type: BLOCK_TYPE_DISPLAY,
    data: {
        html: '',
    },
    listeners: {},
    slots: {},
    render: HTMLBlock,
    icon: Code,
    menu: HTMLBlockMenu,
};
