import {
    buildSpacingSection,
    buildDimensionsSection,
    buildColorSection,
    buildTypographySection,
    buildTextAlignSection,
    buildBorderSection,
    buildShowField,
    buildListener,
} from '../block-defaults.shared';
import { FormatListBulleted } from '@mui/icons-material';
import { BLOCK_TYPE_DISPLAY } from '../block-defaults.constants';
import { SwitchSettings } from '../../settings/shared/SwitchSettings';
import {
    QueryInputSettings,
    QuerySelectionSettings,
    SelectInputSettings,
} from '../../settings';
import { BlockSettingsConfig } from '../settings.types';

// export the config for the block
export const config: BlockSettingsConfig = {
    type: BLOCK_TYPE_DISPLAY,
    icon: FormatListBulleted,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Markdown',
                    render: ({ id }) => (
                        <QueryInputSettings
                            id={id}
                            label="Markdown"
                            path="markdown"
                        />
                    ),
                },
                {
                    description: 'Enable Typewriting Effect',
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Enable Typewriting Effect"
                            path="isStreaming"
                        />
                    ),
                },
            ],
        },
        {
            name: 'Load State',
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
                {
                    description: 'Load Skeleton',
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            path="loadSkeleton"
                            label="Loading Skeleton"
                            options={[
                                { value: '', display: 'None' },
                                {
                                    value: 'LoadingSkeleton',
                                    display: 'Skeleton',
                                },
                            ]}
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
    styleMenu: [buildTypographySection(), buildTextAlignSection()],
};
