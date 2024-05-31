import { CSSProperties } from 'react';
import { BlockConfig } from '@/stores';
import {
    InputSettings,
    QuerySelectionSettings,
} from '@/components/block-settings';

import { UploadBlockDef, UploadBlock } from './UploadBlock';
import { Upload } from '@mui/icons-material';
import { BLOCK_TYPE_INPUT } from '../block-defaults.constants';
import { buildListener } from '../block-defaults.shared';
import { InputModalSettings } from '@/components/block-settings/shared/InputModalSettings';
import { UploadSettings } from '@/components/block-settings/shared/UploadSettings';
export const DefaultStyles: CSSProperties = {
    width: '100%',
    padding: '4px',
};

// export the config for the block
export const config: BlockConfig<UploadBlockDef> = {
    widget: 'upload',
    type: BLOCK_TYPE_INPUT,
    data: {
        style: DefaultStyles,
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
    slots: {},
    render: UploadBlock,
    icon: Upload,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Value',
                    render: ({ id }) => (
                        <UploadSettings id={id} label="Value" path={'value'} />
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
                            queryPath="isLoading"
                        />
                    ),
                },
            ],
        },
        {
            name: 'on Change',
            children: [...buildListener('onChange')],
        },
    ],
    styleMenu: [],
};
