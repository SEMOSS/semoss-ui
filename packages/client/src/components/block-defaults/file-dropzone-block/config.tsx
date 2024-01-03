import { BlockConfig } from '@/stores';
import { BLOCK_TYPE_UPLOAD } from '../block-defaults.constants';
import { FileDropZoneBlockDef, FileDropZoneBlock } from './FileDropZoneBlock';
import { InputSettings } from '@/components/block-settings';
import {
    buildBorderSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildTypographySection,
    buildColorSection,
} from '../block-defaults.shared';
import OpenInBrowserRoundedIcon from '@mui/icons-material/OpenInBrowserRounded';

export const config: BlockConfig<FileDropZoneBlockDef> = {
    widget: 'file-upload',
    type: BLOCK_TYPE_UPLOAD,
    data: {
        style: {},
        name: 'New File Upload',
        value: [],
        type: 'Accepeted File Types',
        extensions: ['All', 'csv', 'doc', 'pdf', 'txt', 'xlsx', 'ZIP'],
        onChange: (files: File[]) => ({ files }),
        size: 0,
        sizeLimit: '30',
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
                    description: 'Input block setting for the name of the file',
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
                        <InputSettings id={id} label="Size" path="sizeLimit" />
                    ),
                },
            ],
        },
    ],
    styleMenu: [
        buildBorderSection(),
        buildDimensionsSection(),
        buildSpacingSection(),
        buildColorSection(),
        buildTypographySection(),
    ],
};
