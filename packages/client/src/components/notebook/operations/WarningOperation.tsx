import { Typography } from '@semoss/ui';
import { observer } from 'mobx-react-lite';

interface WarningOperationProps {
    /** Message returned when there is an error */
    output: string;
}

/**
 * Render the content of a cell in the notebook
 */
export const WarningOperation = observer(
    (props: WarningOperationProps): JSX.Element => {
        const { output } = props;

        return (
            <Typography variant="caption" color="warning">
                {output}
            </Typography>
        );
    },
);
