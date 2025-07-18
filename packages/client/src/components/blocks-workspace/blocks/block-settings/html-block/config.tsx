import { Code } from '@mui/icons-material';
import { BLOCK_TYPE_DISPLAY } from '../block-defaults.constants';
import { HTMLBlockMenu } from '../../settings/custom/html/HTMLBlockMenu';
import { BlockSettingsConfig } from '../settings.types';

// export the config for the block
export const config: BlockSettingsConfig = {
    type: BLOCK_TYPE_DISPLAY,
    icon: Code,
    menu: HTMLBlockMenu,
};
