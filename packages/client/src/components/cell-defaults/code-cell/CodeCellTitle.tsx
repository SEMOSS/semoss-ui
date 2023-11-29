import { Select } from '@semoss/ui';

import { ActionMessages, CellComponent } from '@/stores';
import { useBlocks } from '@/hooks';
import { CodeCellDef } from './config';

export const CodeCellTitle: CellComponent<CodeCellDef> = (props) => {
    const { step } = props;
    const { state } = useBlocks();
    return (
        <Select
            size="small"
            value={step.parameters.type}
            onChange={(e) =>
                state.dispatch({
                    message: ActionMessages.UPDATE_STEP,
                    payload: {
                        queryId: step.query.id,
                        stepId: step.id,
                        path: 'parameters.type',
                        value: e.target.value,
                    },
                })
            }
        >
            <Select.Item value="r"> R</Select.Item>
            <Select.Item value="py"> Py</Select.Item>
            <Select.Item value="pixel"> Pixel</Select.Item>
        </Select>
    );
};
