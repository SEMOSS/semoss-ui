import { Schema } from '@mui/icons-material';

import { MermaidBlockMenu } from '../../settings/custom/mermaid/MermaidBlockMenu';
import { BlockSettingsConfig } from '../settings.types';
import { BLOCK_TYPE_MERMAID } from '../block-defaults.constants';

export const config: BlockSettingsConfig = {
    type: BLOCK_TYPE_MERMAID,
    icon: Schema,
    menu: MermaidBlockMenu,
};
