import { styled } from '@semoss/ui';
import { observer } from 'mobx-react-lite';

const StyledJson = styled('pre')(({ theme }) => ({
    ...theme.typography.body2,
    textWrap: 'wrap',
    maxHeight: '200px',
    overflowY: 'scroll',
}));

interface DefaultOperationProps {
    /** Output of the code */
    output: unknown;
}

/**
 * Render the default JSON of the operation
 */
export const DefaultOperation = observer(
    (props: DefaultOperationProps): JSX.Element => {
        const { output } = props;

        if (typeof output === 'string') {
            return <StyledJson>{output}</StyledJson>;
        }

        return <StyledJson>{JSON.stringify(output, null, 4)}</StyledJson>;
    },
);
