import React from 'react';
import { observer } from 'mobx-react-lite';

import { CellState } from '@/stores';
import { ErrorOperation } from './ErrorOperation';
import { FrameOperation } from './FrameOperation';
import { WarningOperation } from './WarningOperation';
import { SuccessOperation } from './SuccessOperation';
import { DefaultOperation } from './DefaultOperation';

interface OperationProps {
    /**
     * Operation controls the view that will be rendered
     */
    operation: CellState['operation'][number];

    /**
     * Output used by the operation
     */
    output: CellState['output'];
}

/**
 * Operation that is rendered
 */
export const Operation = observer((props: OperationProps): JSX.Element => {
    const { operation, output } = props;

    if (operation === 'SUCCESS') {
        return <SuccessOperation output={output as string} />;
    } else if (operation === 'WARNING') {
        return <WarningOperation output={output as string} />;
    } else if (operation === 'ERROR') {
        return <ErrorOperation output={output as string} />;
    } else if (operation === 'FRAME_DATA_CHANGE') {
        return (
            <FrameOperation
                output={
                    output as {
                        name: string;
                        type: 'NATIVE' | 'PY' | 'GRID' | 'R';
                    }
                }
            />
        );
    }

    return <DefaultOperation output={output} />;
});
