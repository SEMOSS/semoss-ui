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
        },
    },
    listeners: {},
    slots: {
        test: [],
    },
    render: FileUploadBlock,
    icon: CloudUploadIcon,
    //* Block Settings, Menu, & Sections
    contentMenu: [
        {
            name: 'View File Settings',
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
            ],
        },
    ],
    styleMenu: [
        buildLayoutSection(),
        buildDimensionsSection(),
        buildSpacingSection(),
        buildTypographySection(),
    ],
};
