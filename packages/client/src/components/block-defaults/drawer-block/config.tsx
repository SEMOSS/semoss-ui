import { BlockConfig } from '@/stores';
import {
    ArrowBack,
    ArrowDownward,
    ArrowForward,
    ArrowUpward,
    Schema,
} from '@mui/icons-material';
import { BLOCK_TYPE_LAYOUT } from '../block-defaults.constants';
import { DrawerBlock, DrawerBlockDef } from './DrawerBlock';
import {
    ButtonGroupSettings,
    SizeSettings,
    SwitchSettings,
    QueryInputSettings,
} from '@/components/block-settings';
import {
    buildColorSection,
    buildBorderSection,
} from '../block-defaults.shared';

export const config: BlockConfig<DrawerBlockDef> = {
    widget: 'drawer',
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {},
        anchor: 'left',
        drawerWidth: 240,
        drawerHeight: '100%',
        designMode: true, // Default to design mode when first dropped
        open: '', // Default to closed
    },
    listeners: {},
    slots: {
        content: [],
    },
    render: DrawerBlock,
    icon: Schema,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Design Mode',
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Design Mode"
                            path="designMode"
                            description="Enable to edit modal content"
                        />
                    ),
                },
                {
                    description: 'Open',
                    render: ({ id }) => (
                        <QueryInputSettings
                            id={id}
                            label="Open Modal"
                            path="open"
                        />
                    ),
                },
                {
                    description: 'Drawer Width',
                    render: ({ id }) => (
                        <SizeSettings
                            id={id}
                            label="Drawer Width"
                            path="drawerWidth"
                        />
                    ),
                },
                {
                    description: 'Drawer Height',
                    render: ({ id }) => (
                        <SizeSettings
                            id={id}
                            label="Drawer Height"
                            path="drawerHeight"
                        />
                    ),
                },
                {
                    description: 'Direction',
                    render: ({ id }) => (
                        <ButtonGroupSettings
                            id={id}
                            path="anchor"
                            label="Direction"
                            options={[
                                {
                                    value: 'top',
                                    icon: ArrowDownward,
                                    title: 'Top',
                                    isDefault: false,
                                },
                                {
                                    value: 'left',
                                    icon: ArrowForward,
                                    title: 'Left',
                                    isDefault: true,
                                },
                            ]}
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [
        buildColorSection(),
        {
            name: 'Spacing',
            children: [
                {
                    description: 'Padding',
                    render: ({ id }) => (
                        <SizeSettings
                            id={id}
                            label="Padding"
                            path="style.padding"
                        />
                    ),
                },
            ],
        },
        buildBorderSection(),
    ],
};
