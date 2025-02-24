import { BlockConfig } from '@/stores';
import {
    ArrowBack,
    ArrowDownward,
    ArrowForward,
    ArrowUpward,
    Schema,
} from '@mui/icons-material';
import { BLOCK_TYPE_LAYOUT } from '../block-defaults.constants';
import { SidebarMenuBlock, SidebarMenuBlockDef } from './SidebarMenuBlock';
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

export const config: BlockConfig<SidebarMenuBlockDef> = {
    widget: 'sidebar-menu',
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {},
        anchor: 'left',
        sidebarWidth: 240,
        sidebarHeight: '100%',
        designMode: true, // Default to design mode when first dropped
        open: '', // Default to closed
    },
    listeners: {},
    slots: {
        content: [],
    },
    render: SidebarMenuBlock,
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
                    description: 'Sidebar Width',
                    render: ({ id }) => (
                        <SizeSettings
                            id={id}
                            label="Sidebar Width"
                            path="sidebarWidth"
                        />
                    ),
                },
                {
                    description: 'Sidebar Height',
                    render: ({ id }) => (
                        <SizeSettings
                            id={id}
                            label="Sidebar Height"
                            path="sidebarHeight"
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
