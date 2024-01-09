import { Token } from '../../prompt.types';
import { PromptTokenChip } from './PromptTokenChip';

export const PromptReadonlyInputToken = (props: { tokenKey: string }) => {
    return (
        <PromptTokenChip
            isChipSelected={false}
            label={`{ } ${props.tokenKey}`}
            size="small"
            disableHover
        />
    );
};
