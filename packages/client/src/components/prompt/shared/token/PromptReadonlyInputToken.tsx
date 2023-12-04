import { Token } from '../../prompt.types';
import { PromptTokenChip } from './PromptTokenChip';

export const PromptReadonlyInputToken = (props: { token: Token }) => {
    return (
        <PromptTokenChip
            isChipSelected={false}
            key={props.token.index}
            label={`{ } ${props.token.key}`}
            size="small"
            disableHover
        />
    );
};
