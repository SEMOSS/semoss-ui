import { BlockConfig } from '@/stores';
import { BorderBottom } from '@mui/icons-material';

import {
    buildLayoutSection,
    buildColorSection,
    buildTypographySection,
} from '../block-defaults.shared';

import { FooterBlockDef, FooterBlock } from './FooterBlock';
import { BLOCK_TYPE_LAYOUT } from '../block-defaults.constants';
import { SelectInputSettings } from '@/components/block-settings/shared/SelectInputSettings';

// export the config for the block
export const config: BlockConfig<FooterBlockDef> = {
    widget: 'footer',
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {
            display: 'flex',
            height: '5%',
            width: '100%',
        },
    },
    listeners: {},
    slots: {
        content: [],
    },
    render: FooterBlock,
    icon: BorderBottom,
    contentMenu: [],
    styleMenu: [
        buildLayoutSection(),
        // root footers don't get margin for spacing
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
