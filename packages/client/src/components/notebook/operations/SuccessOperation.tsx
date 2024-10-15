import { Typography } from '@semoss/ui';
import { observer } from 'mobx-react-lite';
import { JsonViewer } from '@textea/json-viewer';
import { isOutputJSON } from '@/utility';

interface SuccessOperationProps {
    /** Message returned when there is an error */
    output: string;
}

/**
 * Render the content of a cell in the notebook
 */
export const SuccessOperation = observer(
    (props: SuccessOperationProps): JSX.Element => {
        const { output } = props;
        const value = isOutputJSON(output);
        if (value != null) {
            return (
                <JsonViewer
                    value={value}
                    displayComma={true}
                    rootName={false}
                />
            );
        } else {
            return (
                <Typography variant="caption" color="success">
                    {output}
                </Typography>
            );
        }
    },
);
