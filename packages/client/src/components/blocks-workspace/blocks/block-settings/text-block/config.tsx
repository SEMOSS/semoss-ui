import { CSSProperties } from 'react';
import {
    buildTypographySection,
    buildTextAlignSection,
    buildShowField,
    buildListener,
} from '../block-defaults.shared';
import { TextFields } from '@mui/icons-material';
import { BLOCK_TYPE_DISPLAY } from '../block-defaults.constants';
import {
    QueryInputSettings,
    QuerySelectionSettings,
    SelectInputSettings,
} from '../../settings';
import { SwitchSettings } from '../../settings/shared/SwitchSettings';
import { BlockSettingsConfig } from '../settings.types';

export const DefaultStyles: CSSProperties = {
    padding: '4px',
    whiteSpace: 'pre-line',
    textOverflow: 'ellipsis',
};

// export the config for the block
export const config: BlockSettingsConfig = {
    type: BLOCK_TYPE_DISPLAY,
    icon: TextFields,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Text',
                    render: ({ id }) => (
                        <QueryInputSettings id={id} label="Text" path="text" />
                    ),
                },
                {
                    description: 'Enable Typewriting Effect',
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Enable Typewriting Effect"
                            path="isStreaming"
                            description="This setting will enable the typewriting effect on the text"
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
