//* State Management & Helpers
import { BlockConfig } from '@/stores';

//* UI Blocks & Settings
import { BLOCK_TYPE_UPLOAD } from '../block-defaults.constants';
import { FileDropZoneBlockDef, FileDropZoneBlock } from './FileDropZoneBlock';
import { InputSettings } from '@/components/block-settings';
import { SwitchSettings } from '@/components/block-settings/shared/SwitchSettings';
import { FileExtensionSettings } from '@/components/block-settings/shared/FileExtensionSettings';
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
        value: [],
        type: 'Accepeted File Types',
        extensions: ['.csv', '.doc', '.pdf', '.txt', '.xlsx', '.zip'],
        onChange: (files: File[]) => ({ files }),
        size: 0,
        sizeLimit: '30 MB',
        multiple: true,
        valid: true,
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
                    description: 'Input block setting for the file size limit',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Total Upload Size"
                            path="sizeLimit"
                        />
                    ),
                },
                {
                    description: 'Accepted Uploaded File Types',
                    render: ({ id }) => (
                        <>
                            <InputSettings
                                id={id}
                                label="File Extensions"
                                path="extensions"
                                disabled={true}
                            />
                            <FileExtensionSettings
                                id={id}
                                path="extensions"
                                extensions={[
                                    '.csv',
                                    '.doc',
                                    '.pdf',
                                    '.txt',
                                    '.xlsx',
                                    '.zip',
                                ]}
                            />
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
