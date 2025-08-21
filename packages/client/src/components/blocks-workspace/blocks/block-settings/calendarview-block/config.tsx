import { CalendarMonth } from '@mui/icons-material';

import { BLOCK_TYPE_DISPLAY } from '../block-defaults.constants';
import {
    buildLayoutSection,
    buildShowField,
    buildListener,
} from '../block-defaults.shared';
import { QueryInputSettings } from '../../settings';
import { SwitchSettings } from '../../settings/shared/SwitchSettings';
import { BlockSettingsConfig } from '../settings.types';

// export the config for the block
export const config: BlockSettingsConfig = {
    type: BLOCK_TYPE_DISPLAY,
    icon: CalendarMonth,
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
                            description="Enable to edit calendar content on all dates"
                        />
                    ),
                },
            ],
        },
        {
            name: 'Data Source',
            children: [
                {
                    description: 'Source',
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
