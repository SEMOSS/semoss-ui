import { BlockConfig } from '@/stores';
import { BorderTop } from '@mui/icons-material';

import {
    buildLayoutSection,
    buildColorSection,
    buildTypographySection,
    buildDimensionsSection,
} from '../block-defaults.shared';

import { HeaderBlockDef, HeaderBlock } from './HeaderBlock';
import { BLOCK_TYPE_LAYOUT } from '../block-defaults.constants';
import { SelectInputSettings } from '@/components/block-settings/shared/SelectInputSettings';

// export the config for the block
export const config: BlockConfig<HeaderBlockDef> = {
    widget: 'header',
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {
            height: '10%',
        },
    },
    listeners: {},
    slots: {
        content: [],
    },
    render: HeaderBlock,
    icon: BorderTop,
    contentMenu: [],
    styleMenu: [
        buildDimensionsSection(),
        buildLayoutSection(),
        // root headers don't get margin for spacing
        {
            name: 'Spacing',
            children: [
                {
                    description: 'Padding',
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            path="style.padding"
                            label="Padding"
                            options={[
                                {
                                    value: '1rem',
                                    display: 'Small',
                                },
                                {
                                    value: '2rem',
                                    display: 'Medium',
                                },
                                {
                                    value: '3rem',
                                    display: 'Large',
                                },
                                {
                                    value: '4rem',
                                    display: 'X-Large',
                                },
                            ]}
                            allowUnset
                        />
                    ),
                },
            ],
        },
        buildColorSection(),
        buildTypographySection(),
    ],
};
