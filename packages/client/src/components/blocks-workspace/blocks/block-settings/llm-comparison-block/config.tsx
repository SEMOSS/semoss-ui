import { SmartButton } from '@mui/icons-material';

import { BLOCK_TYPE_COMPARE } from '../block-defaults.constants';
import { LLMComparisonMenu } from '../../settings/custom/llm-comparison/LLMComparisonMenu';
import { BlockSettingsConfig } from '../settings.types';

export const config: BlockSettingsConfig = {
    type: BLOCK_TYPE_COMPARE,
    icon: SmartButton,
    menu: LLMComparisonMenu,
};
