import { BlockConfig } from '@/stores';
import { InputSettings } from '@/components/block-settings';

import {
    buildDimensionsSection,
    buildTypographySection,
} from '../block-defaults.shared';

import { LinkBlockDef, LinkBlock } from './LinkBlock';
import { ArrowDownward, ArrowForward, Link } from '@mui/icons-material';
import { BLOCK_TYPE_ACTION } from '../block-defaults.constants';
import { ButtonGroupSettings } from '../../block-settings';

// export the config for the block
export const config: BlockConfig<LinkBlockDef> = {
    widget: 'link',
    type: BLOCK_TYPE_ACTION,
    data: {
        style: {
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            padding: '4px',
            gap: '8px',
        },
        src: '',
    },
    listeners: {},
    slots: {
        children: [],
    },
    render: LinkBlock,
    icon: Link,
    isBlocksMenuEnabled: true,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Destination',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Destination" path="src" />
                    ),
                },
                {
                    description: 'Label',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Label" path="label" />
                    ),
                },
            ],
        },
    ],
    styleMenu: [
        {
            name: 'Layout',
            children: [
                {
                    description: 'Direction',
                    render: ({ id }) => (
                        <ButtonGroupSettings
                            id={id}
                            path="style.flexDirection"
                            label="Direction"
                            options={[
                                {
                                    value: 'column',
                                    icon: ArrowDownward,
                                    title: 'Column',
                                    isDefault: true,
                                },
                                {
                                    value: 'row',
                                    icon: ArrowForward,
                                    title: 'Row',
                                    isDefault: false,
                                },
                            ]}
                        />
                    ),
                },
            ],
        },
        buildDimensionsSection(),
        buildTypographySection(),
    ],
};
