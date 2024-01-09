import { BlockConfig } from '@/stores';
import {
    BLOCK_TYPE_CUSTOM,
    BLOCK_TYPE_INPUT,
} from '../block-defaults.constants';
import { FileEmbedBlockDef, FileEmbedBlock } from './FileEmbedBlock';
import { InputSettings } from '@/components/block-settings';
import {
    buildBorderSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildTypographySection,
    buildColorSection,
} from '../block-defaults.shared';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';

export const config: BlockConfig<FileEmbedBlockDef> = {
    widget: 'file-embed',
    type: BLOCK_TYPE_INPUT,
    data: {
        style: {},
        name: 'Embed File',
        value: [],
        type: 'Value',
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
    render: FileEmbedBlock,
    icon: CloudUploadOutlinedIcon,
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
                        <InputSettings
                            id={id}
                            label="Size limit"
                            path="sizeLimit"
                        />
                    ),
                },
                {
                    description: 'Input block setting for the file type',
                    render: ({ id }) => (
                        <InputSettings id={id} label="File type" path="type" />
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
