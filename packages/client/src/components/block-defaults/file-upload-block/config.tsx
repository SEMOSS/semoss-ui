//* Defining new block configurations

import { BlockConfig } from '@/stores';

import { FileUploadBlockDef, FileUploadBlock } from './FileUploadBlock';

import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';

import { InputSettings } from '@/components/block-settings';
import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildStyleSection,
    buildTypographySection,
} from '../block-defaults.shared';

export const config: BlockConfig<FileUploadBlockDef> = {
    widget: 'file-upload',
    data: {
        style: {},
        name: {
            path: '' || null,
        },
    },
    listeners: {},
    slots: {
        test: [],
    },
    render: FileUploadBlock,
    icon: CloudUploadIcon,
    menu: [
        {
            name: 'View File Settings',
            children: [
                {
                    description: 'Doc Path',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Name" path="name.path" />
                    ),
                },
            ],
        },
        buildLayoutSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
        buildStyleSection(),
        buildTypographySection(),
    ],
    type: '',
};
