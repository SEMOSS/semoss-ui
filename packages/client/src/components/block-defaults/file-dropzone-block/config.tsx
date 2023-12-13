//* State Management & Helpers
import { BlockConfig } from '@/stores';

//* UI Blocks & Settings
import { BLOCK_TYPE_UPLOAD } from '../block-defaults.constants';
import { FileDropZoneBlockDef, FileDropZoneBlock } from './FileDropZoneBlock';
import { InputSettings } from '@/components/block-settings';
import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildTypographySection,
    buildColorSection,
} from '../block-defaults.shared';

//* Material UI Components
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';

export const config: BlockConfig<FileDropZoneBlockDef> = {
    widget: 'file-dropzone',
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
    render: FileDropZoneBlock,
    icon: DriveFileMoveIcon,
    contentMenu: [
        {
            name: 'FileDropZone Settings',
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
                            label="Size"
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
