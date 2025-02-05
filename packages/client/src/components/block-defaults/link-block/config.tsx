import { BlockConfig } from '@/stores';
import {
    InputSettings,
    SelectInputSettings,
    SwitchSettings,
} from '@/components/block-settings';

import {
    buildTextAlignSection,
    buildTypographySection,
} from '../block-defaults.shared';

import { LinkBlockDef, LinkBlock } from './LinkBlock';
import { Link } from '@mui/icons-material';
import { BLOCK_TYPE_ACTION } from '../block-defaults.constants';
import { useBlocks } from '@/hooks';

// export the config for the block
export const config: BlockConfig<LinkBlockDef> = {
    widget: 'link',
    type: BLOCK_TYPE_ACTION,
    data: {
        style: {
            padding: '4px',
            whiteSpace: 'pre-line',
            textOverflow: 'ellipsis',
        },
        href: '',
        text: 'Insert text',
        isExternal: false,
    },
    listeners: {},
    slots: {},
    render: LinkBlock,
    icon: Link,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Destination',
                    render: ({ id }) => {
                        const { state } = useBlocks();
                        const allPagesOptions = state
                            .getAllBlocksOfType('page')
                            .map((pd) => ({
                                value: pd.data.route as string,
                                display: pd.data.route as string,
                            }));
                        return (
                            <SelectInputSettings
                                id={id}
                                label="href"
                                path="href"
                                options={allPagesOptions}
                                resizeOnSet
                            />
                        );
                    },
                },
                {
                    description: 'Text',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Text" path="text" />
                    ),
                },
                {
                    description: 'External link',
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Enable External Link"
                            path="isExternal"
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [buildTypographySection(), buildTextAlignSection()],
};
