import { BlockConfig } from '@/stores';
import {
    InputSettings,
    QuerySelectionSettings,
} from '@/components/block-settings';

import { UploadBlockDef, UploadBlock } from './UploadBlock';
import { FormatShapes } from '@mui/icons-material';
import {
    buildDimensionsSection,
    buildSpacingSection,
} from '../block-defaults.shared';
import { BLOCK_TYPE_INPUT } from '../block-defaults.constants';
import { InputModalSettings } from '@/components/block-settings/shared/InputModalSettings';

// export the config for the block
export const config: BlockConfig<UploadBlockDef> = {
    widget: 'upload',
    type: BLOCK_TYPE_INPUT,
    data: {
        style: {
            width: '100%',
            padding: '8px',
        },
        value: '',
        label: 'Example Input',
        hint: '',
        loading: false,
        disabled: false,
        required: false,
    },
    listeners: {
        onChange: [],
    },
    slots: {
        content: [],
    },
    render: UploadBlock,
    icon: FormatShapes,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Value',
                    render: ({ id }) => (
                        <InputModalSettings
                            id={id}
                            label="Value"
                            path="value"
                        />
                    ),
                },
                {
                    description: 'Label',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Label" path="label" />
                    ),
                },
                {
                    description: 'Hint',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Hint" path="hint" />
                    ),
                },
                {
                    description: 'Loading',
                    render: ({ id }) => (
                        <QuerySelectionSettings
                            id={id}
                            label="Loading"
                            path="loading"
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [buildSpacingSection(), buildDimensionsSection()],
};
