import { BlockComponent, BlockDef } from '@/stores';
import { observer } from 'mobx-react-lite';

export interface LLMComparisonBlockDef extends BlockDef<'llmComparison'> {
    widget: 'llmComparison';
    slots: never;
}

export const LLMComparisonBlock: BlockComponent = observer(({ id }) => {
    return (
        <div>
            <span>LLM Comparison Tab Box to be built</span>
        </div>
    );
});
