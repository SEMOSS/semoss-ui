import { BlockConfig } from '@/stores';
import {
    LLMComparisonBlock,
    LLMComparisonBlockDef,
} from './LLMComparisonBlock';
import { BLOCK_TYPE_COMPARE } from '../block-defaults.constants';
import { SmartButton } from '@mui/icons-material';
import { LLMComparisonMenu } from './LLMComparisonMenu';

export const config: BlockConfig<LLMComparisonBlockDef> = {
    widget: 'llmComparison',
    type: BLOCK_TYPE_COMPARE,
    data: {
        variableId: '',
    },
    listeners: {},
    slots: {},
    render: LLMComparisonBlock,
    icon: SmartButton,
    menu: LLMComparisonMenu,
};
