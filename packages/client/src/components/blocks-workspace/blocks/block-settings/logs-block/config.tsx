import { HighlightAlt } from '@mui/icons-material';

import { BLOCK_TYPE_LAYOUT } from '../block-defaults.constants';
import { QueryNameDropdownSettings } from '../../settings/custom/QueryNameDropdownSettings';
import { buildShowField, buildListener } from '../block-defaults.shared';
import { BlockSettingsConfig } from '../settings.types';

export const config: BlockSettingsConfig = {
    type: BLOCK_TYPE_LAYOUT,
    icon: HighlightAlt,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Sheet',
                    render: ({ id }) => (
                        <QueryNameDropdownSettings
                            id={id}
                            label="Query"
                            path="queryId"
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
    styleMenu: [],
};
