//! FILE IMPORTS
//* State Management & Helpers
import { BlockConfig } from '@/stores';

//* Material UI Components
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';

//* UI Blocks & Settings
import { BLOCK_TYPE_UPLOAD } from '../block-defaults.constants';
import { FileUploadBlockDef, FileUploadBlock } from './FileUploadBlock';
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
    type: BLOCK_TYPE_UPLOAD,
    data: {
        style: {
            width: '100%',
            fontSize: '1rem',
            border: '3px solid black',
            borderRadius: '8px',
            padding: '10px',
        },
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
    menu: [
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
        buildLayoutSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
        buildStyleSection(),
        buildTypographySection(),
    ],
};
