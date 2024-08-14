import { BlockConfig } from '@/stores';

import { LLMBlockDef, LLMBlock } from './LLMBlock';
import { Link } from '@mui/icons-material';
import { BLOCK_TYPE_ACTION } from '../block-defaults.constants';
import { LLMComparisonMenu } from './LLMComparisonMenu';

// export the config for the block
export const config: BlockConfig<LLMBlockDef> = {
    widget: 'llm',
    type: BLOCK_TYPE_ACTION,
    data: {
        style: {},

        /**
         * What are we tracing this too
         */
        to: '',
        /**
         *
         */
        variants: [],
    },
    listeners: {},
    slots: {},
    render: LLMBlock,
    icon: Link,
    menu: LLMComparisonMenu,
};
