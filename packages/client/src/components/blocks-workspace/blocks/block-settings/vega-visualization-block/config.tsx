import { Insights } from '@mui/icons-material';

import { BLOCK_TYPE_CHART } from '../block-defaults.constants';
import { VegaVisualizationBlockMenu } from '../../settings/custom/vega/VegaVisualizationBlockMenu';
import { BlockSettingsConfig } from '../settings.types';

export const config: BlockSettingsConfig = {
    type: BLOCK_TYPE_CHART,
    icon: Insights,
    menu: VegaVisualizationBlockMenu,
};
