import { CSSProperties } from 'react';
import { BlockConfig } from '@/stores';
import { FileCopyOutlined } from '@mui/icons-material';

import {
    buildLayoutSection,
    buildColorSection,
    buildTypographySection,
    buildListener,
} from '../block-defaults.shared';

import { PageBlockDef, PageBlock } from './PageBlock';
import { BLOCK_TYPE_LAYOUT } from '../block-defaults.constants';
import {
    BorderSettings,
    QuerySelectionSettings,
    SizeSettings,
} from '@/components/block-settings';

export const DefaultStyles: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    gap: '8px',
    fontFamily: 'roboto',
};

// export the config for the block
export const config: BlockConfig<PageBlockDef> = {
    widget: 'page',
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: DefaultStyles,
        loading: false,
    },
    listeners: {
        onPageLoad: [],
    },
    slots: {
        content: [],
    },
    render: PageBlock,
    icon: FileCopyOutlined,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Loading',
                    render: ({ id }) => (
                        <QuerySelectionSettings
                            id={id}
                            label="Loading"
                            path="loading"
                            queryPath="isLoading"
                        />
                    ),
                },
            ],
        },
        // {
        //     name: 'on Page Load',
        //     children: [...buildListener('onPageLoad')],
        // },
    ],
    styleMenu: [
        buildLayoutSection(),
        // root pages don't get margin for spacing
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
        buildColorSection(),
        {
            name: 'Border',
            children: [
                {
                    description: 'Border',
                    render: ({ id }) => (
                        <BorderSettings id={id} path="style.border" />
                    ),
                },
            ],
        },
        buildTypographySection(),
    ],
};
