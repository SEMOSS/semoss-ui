import { Select } from '@semoss/ui';

import { CellComponent } from '@/stores';
import { useNotebook } from '@/hooks';
import { CodeCellDef } from './config';

export const CodeCellTitle: CellComponent<CodeCellDef> = (props) => {
    const { step } = props;
    const { notebook } = useNotebook();
    return (
        <Select
            size="small"
            value={step.parameters.type}
            onChange={(e) =>
                notebook.updateStep(
                    step.query.id,
                    step.id,
                    'parameters.type',
                    e.target.value,
                )
            }
        >
            <Select.Item value="r"> R</Select.Item>
            <Select.Item value="py"> Py</Select.Item>
            <Select.Item value="pixel"> Pixel</Select.Item>
        </Select>
    );
};
