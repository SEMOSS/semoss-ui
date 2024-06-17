import { BlockConfig } from '@/stores';
import {
    LLMComparisonBlock,
    LLMComparisonBlockDef,
} from './LLMComparisonBlock';
import { BLOCK_TYPE_COMPARE } from '../block-defaults.constants';
import { SmartButton } from '@mui/icons-material';

export const config: BlockConfig<LLMComparisonBlockDef> = {
    widget: 'llmComparison',
    type: BLOCK_TYPE_COMPARE,
    data: {},
    listeners: {},
    slots: {},
    render: LLMComparisonBlock,
    icon: SmartButton,
};
