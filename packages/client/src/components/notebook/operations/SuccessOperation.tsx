import { Typography } from '@semoss/ui';
import { observer } from 'mobx-react-lite';

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

        return (
            <Typography variant="caption" color="success">
                {output}
            </Typography>
        );
    },
);
