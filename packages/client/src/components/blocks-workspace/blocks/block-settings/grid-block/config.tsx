import { TableChart } from '@mui/icons-material';

import { BLOCK_TYPE_DATA } from '../block-defaults.constants';
import { GridBlockMenu } from './../../settings/custom/grid-two/GridBlockMenu';
import { BlockSettingsConfig } from '../settings.types';

// export the config for the block
export const config: BlockSettingsConfig = {
    type: BLOCK_TYPE_DATA,
    icon: TableChart,
    menu: GridBlockMenu,
};
