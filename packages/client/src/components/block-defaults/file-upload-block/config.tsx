//* State Management & Helpers
import { BlockConfig } from '@/stores';

//* UI Blocks & Settings
import { BLOCK_TYPE_UPLOAD } from '../block-defaults.constants';
import { FileUploadBlockDef, FileUploadBlock } from './FileUploadBlock';
import { InputSettings } from '@/components/block-settings';
import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildTypographySection,
    buildColorSection,
} from '../block-defaults.shared';

//* Material UI Components
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';

export const config: BlockConfig<FileUploadBlockDef> = {
    widget: 'file-upload',
    type: BLOCK_TYPE_UPLOAD,
    data: {
        style: {},
        name: {
            path: 'File Name' || null,
            type: 'File Type' || null,
            size: 0 || null,
        },
    },
    listeners: {},
    slots: {
        test: [],
    },
    render: FileUploadBlock,
    icon: CloudUploadIcon,
    contentMenu: [
        {
            name: 'File Settings',
            children: [
                {
                    description: 'The name of the File uploaded',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Name"
                            path="name.path"
                            disabled={true}
                        />
                    ),
                },
                {
                    description: 'The type of the File uploaded',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Type"
                            path="name.type"
                            disabled={true}
                        />
                    ),
                },
                {
                    description: 'The size of the File uploaded',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Size (Megabytes)"
                            path="name.size"
                            disabled={true}
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [
        buildLayoutSection(),
        buildDimensionsSection(),
        buildSpacingSection(),
        buildColorSection(),
        buildTypographySection(),
    ],
};
