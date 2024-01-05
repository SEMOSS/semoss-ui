import { BlockConfig } from '@/stores';
import {
    InputSettings,
    PageSelectionSettings,
} from '@/components/block-settings';

import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildColorSection,
    buildTypographySection,
    buildBorderSection,
} from '../block-defaults.shared';

import { NavBarBlockDef, NavBarBlock } from './NavBarBlock';
import { Navigation } from '@mui/icons-material';
import { BLOCK_TYPE_ACTION } from '../block-defaults.constants';

// export the config for the block
export const config: BlockConfig<NavBarBlockDef> = {
    widget: 'nav-bar',
    type: BLOCK_TYPE_ACTION,
    data: {
        style: {
            // display: 'flex',
            display: 'inline-flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexDirection: 'row',
        },
        name: 'Example Navbar',
        pages: ['1', '2'],
    },
    listeners: {},
    slots: {},
    render: NavBarBlock,
    icon: Navigation,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Name',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Name" path="name" />
                    ),
                },
                {
                    description: 'Pages',
                    render: ({ id }) => (
                        <PageSelectionSettings
                            id={id}
                            label="Pages"
                            path="pages"
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [
        buildLayoutSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
        buildColorSection(),
        buildBorderSection(),
        buildTypographySection(),
    ],
};
