import { isOutputJSON } from '@/utility';
import { styled } from '@semoss/ui';
import { JsonViewer } from '@textea/json-viewer';
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
            let value = null;
            if (!isOutputJSON(output)) {
                value = output;
                return <StyledJson>{value}</StyledJson>;
            } else {
                value = JSON.parse(output);
                return (
                    <JsonViewer
                        value={value}
                        displayComma={true}
                        rootName={false}
                    />
                );
            }
        }

        if (typeof output === 'object') {
            return (
                <JsonViewer
                    value={output}
                    displayComma={true}
                    rootName={false}
                />
            );
        }
        return <StyledJson>{JSON.stringify(output, null, 4)}</StyledJson>;
    },
);
