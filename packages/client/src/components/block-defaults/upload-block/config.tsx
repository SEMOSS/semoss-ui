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
import { UploadSettings } from '@/components/block-settings/shared/UploadSettings';
import { SelectSettings } from '@/components/block-settings/shared/SelectSettings';
export const DefaultStyles: CSSProperties = {
    width: '100%',
    padding: '4px',
};

export const FileTypes: string[] = [
    '.csv',
    '.txt',
    '.jpeg',
    '.png',
    '.gif',
    '.mp3',
    '.m4a',
    '.wav',
    '.mp4',
    '.mov',
    '.avi',
    '.zip',
    '.rar',
    '.pdf',
    '.docx',
    '.xlx',
    '.xlsx',
    '.bat',
    '.cmd',
    '.sh',
    '.img',
    '.iso',
    '.dmg',
    '.js',
];

// export the config for the block
export const config: BlockConfig<UploadBlockDef> = {
    widget: 'upload',
    type: BLOCK_TYPE_INPUT,
    data: {
        style: DefaultStyles,
        value: '',
        label: 'Example Input',
        hint: '',
        extensions: [],
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
                        <UploadSettings
                            id={id}
                            label="Value"
                            path={'value'}
                            restrictPath={'extensions'}
                        />
                    ),
                },
                {
                    description: 'Extensions',
                    render: ({ id }) => (
                        <SelectSettings
                            id={id}
                            label="Extensions"
                            path={'extensions'}
                            options={FileTypes}
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
