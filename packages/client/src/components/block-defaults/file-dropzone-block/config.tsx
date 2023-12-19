//* State Management & Helpers
import { BlockConfig } from '@/stores';

//* UI Blocks & Settings
import { BLOCK_TYPE_UPLOAD } from '../block-defaults.constants';
import { FileDropZoneBlockDef, FileDropZoneBlock } from './FileDropZoneBlock';
import { InputSettings } from '@/components/block-settings';
import { SwitchSettings } from '@/components/block-settings/shared/SwitchSettings';
import { Checkbox } from '@semoss/ui';
import {
    buildLayoutSection,
    buildBorderSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildTypographySection,
    buildColorSection,
} from '../block-defaults.shared';

//* Material UI Components
import OpenInBrowserRoundedIcon from '@mui/icons-material/OpenInBrowserRounded';

export const config: BlockConfig<FileDropZoneBlockDef> = {
    widget: 'file-dropzone',
    type: BLOCK_TYPE_UPLOAD,
    data: {
        style: {},
        name: 'New File Upload',
        type: 'File Type',
        typeList: ['csv', 'doc', 'pdf', 'txt', 'xlsx', 'ZIP'],
        size: 0,
        sizeLimit: '30 MB',
    },
    listeners: {},
    slots: {
        test: [],
    },
    render: FileDropZoneBlock,
    icon: OpenInBrowserRoundedIcon,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'The Name of the Uploaded File',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Name" path="name" />
                    ),
                },
            ],
        },
        {
            name: 'Configure',
            children: [
                {
                    description: 'Toggle button for setting the file size',
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Set file size"
                            path="size"
                        />
                    ),
                },
                {
                    description: 'Input block setting for the file size limit',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Size" path="sizeLimit" />
                    ),
                },
                {
                    description: 'Toggle button for the file types accepted',
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Set file type"
                            path="type"
                        />
                    ),
                },
                {
                    description: 'Accepted Uploaded File Types',
                    render: ({ id }) => (
                        <>
                            {config.data.typeList.map((type) => (
                                <Checkbox
                                    key={type}
                                    id={id}
                                    label={type}
                                    value={type}
                                    onChange={(e) => {
                                        console.log(
                                            'File Type Selected: ',
                                            type,
                                        );
                                        console.log('Event Target: ', e.target);
                                    }}
                                />
                            ))}
                        </>
                    ),
                },
            ],
        },
    ],
    styleMenu: [
        buildLayoutSection(),
        buildBorderSection(),
        buildDimensionsSection(),
        buildSpacingSection(),
        buildColorSection(),
        buildTypographySection(),
    ],
};
