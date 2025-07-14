import { HighlightAlt } from '@mui/icons-material';

import { BLOCK_TYPE_LAYOUT } from '../block-defaults.constants';
import { ContainerLayoutSettings } from '../../settings';
import {
    buildSpacingSection,
    buildDimensionsSection,
    buildBorderSection,
    buildColorSection,
    buildListener,
    buildShowField,
    buildShadowSection,
} from '../block-defaults.shared';
import { SelectInputSettings } from '../../settings/shared/SelectInputSettings';
import { SizeSettings } from '../../settings/shared/SizeSettings';
import { BlockSettingsConfig } from '../settings.types';

// export the config for the block
export const config: BlockSettingsConfig = {
    type: BLOCK_TYPE_LAYOUT,
    icon: HighlightAlt,
    contentMenu: [
        {
            name: 'Conditional',
            children: [...buildShowField()],
        },
        {
            name: 'Load State',
            children: [
                {
                    description: 'Loading State',
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            path="loadState"
                            label="Loading State"
                            options={[
                                { value: '', display: 'None' },
                                { value: 'skeleton', display: 'Skeleton' },
                            ]}
                        />
                    ),
                },
            ],
        },
        {
            name: 'Pre Process',
            children: [...buildListener('preProcess')],
        },
    ],
    styleMenu: [
        {
            name: 'Layout',
            children: [
                {
                    description: 'Layout',
                    render: ({ id }) => <ContainerLayoutSettings id={id} />,
                },
            ],
        },
        {
            name: 'Position',
            children: [
                {
                    description: 'Position',
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            path="style.position"
                            label="Position"
                            options={[
                                { value: 'static', display: 'Static' },
                                { value: 'relative', display: 'Relative' },
                                { value: 'absolute', display: 'Absolute' },
                                { value: 'fixed', display: 'Fixed' },
                                { value: 'sticky', display: 'Sticky' },
                            ]}
                        />
                    ),
                },
                {
                    description: 'Top',
                    render: ({ id }) => (
                        <SizeSettings id={id} label="Top" path="style.top" />
                    ),
                },
                {
                    description: 'Z-Index',
                    render: ({ id }) => (
                        <SizeSettings
                            id={id}
                            label="Z-Index"
                            path="style.zIndex"
                        />
                    ),
                },
                {
                    description: 'Overflow',
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            path="style.overflow"
                            label="Overflow"
                            options={[
                                { value: 'visible', display: 'Visible' },
                                { value: 'hidden', display: 'Hidden' },
                                { value: 'scroll', display: 'Scroll' },
                                {
                                    value: 'auto',
                                    display: 'Auto',
                                    isDefault: true,
                                },
                            ]}
                        />
                    ),
                },
            ],
        },
        buildSpacingSection(),
        buildDimensionsSection(),
        buildColorSection(),
        buildBorderSection(),
        buildShadowSection(),
    ],
};
