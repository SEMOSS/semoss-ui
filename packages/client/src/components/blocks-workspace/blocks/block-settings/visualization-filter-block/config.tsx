import { BLOCK_TYPE_CHART } from '../block-defaults.constants';
import { VisualizationFilterMenu } from '../../settings/custom/visualization-filter/VisualizationFilterMenu';

import { Link } from '@mui/icons-material';
import { BlockSettingsConfig } from '../settings.types';

export const config: BlockSettingsConfig = {
    type: BLOCK_TYPE_CHART,
    icon: Link,
    menu: VisualizationFilterMenu,
};
