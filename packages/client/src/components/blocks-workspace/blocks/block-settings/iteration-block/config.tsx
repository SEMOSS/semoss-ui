import { FormatShapes } from '@mui/icons-material';

import { BLOCK_TYPE_INPUT } from '../block-defaults.constants';
import {
    buildLayoutSection,
    buildShowField,
    buildListener,
} from '../block-defaults.shared';
import { QueryInputSettings } from '../../settings';
import { BlockSettingsConfig } from '../settings.types';

// export the config for the block
export const config: BlockSettingsConfig = {
    type: BLOCK_TYPE_INPUT,
    icon: FormatShapes,
    contentMenu: [
        {
            name: 'Data Source',
            children: [
                {
                    description: 'Data Source',
                    render: ({ id }) => (
                        <QueryInputSettings
                            id={id}
                            label="Source"
                            path="source"
                        />
                    ),
                },
            ],
        },
        {
            name: 'Conditional',
            children: [...buildShowField()],
        },
        {
            name: 'Pre Process',
            children: [...buildListener('preProcess')],
        },
    ],
    styleMenu: [buildLayoutSection()],
};
