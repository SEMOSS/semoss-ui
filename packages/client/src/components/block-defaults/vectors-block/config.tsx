import { BlockConfig } from '@/stores';
import { VectorsBlockDef, VectorsBlock } from './VectorsBlock';
import { BLOCK_TYPE_CUSTOM } from '../block-defaults.constants';

import {
    buildDimensionsSection,
    buildSpacingSection,
} from '../block-defaults.shared';
import { InputSettings } from '@/components/block-settings';
import { SelectInputValueSettings } from '@/components/block-settings/custom/SelectInputValueSettings';

import TokenOutlinedIcon from '@mui/icons-material/TokenOutlined';

export const config: BlockConfig<VectorsBlockDef> = {
    widget: 'vectors',
    type: BLOCK_TYPE_CUSTOM,
    data: {
        style: {},
        label: 'Vectors',
        options: [],
        value: '',
    },
    listeners: {
        onChange: [],
    },
    slots: {},
    render: VectorsBlock,
    icon: TokenOutlinedIcon,
    contentMenu: [
        {
            name: 'Vector Database Settings',
            children: [
                {
                    description: 'Value',
                    render: ({ id }) => (
                        <SelectInputValueSettings id={id} path="value" />
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
    styleMenu: [buildSpacingSection(), buildDimensionsSection()],
};
