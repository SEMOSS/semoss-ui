import { BlockConfig } from '@/stores';
import { InputSettings } from '@/components/block-settings';
import { StepperBlockDef, StepperBlock } from './StepperBlock';
import { ViewList } from '@mui/icons-material';
import { BLOCK_TYPE_INPUT } from '../block-defaults.constants';
import { StepperStepsSettings } from '@/components/block-settings/shared/StepperStepsSettings';

// export the config for the block
export const config: BlockConfig<StepperBlockDef> = {
    widget: 'stepper',
    type: BLOCK_TYPE_INPUT,
    data: {
        active: 0,
        steps: [],
    },
    listeners: {
        onChange: [],
    },
    slots: {
        content: [],
    },
    render: StepperBlock,
    icon: ViewList,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Steps',
                    render: ({ id }) => (
                        <StepperStepsSettings
                            id={id}
                            label="Steps"
                            path="steps"
                        />
                    ),
                },
                {
                    description: 'Active Step',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Active Step"
                            path="active"
                            type="number"
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [],
};
