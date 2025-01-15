import { CSSProperties, useState } from 'react';
import { BlockConfig } from '@/stores';
import { Close, FileCopyOutlined, OpenInNew } from '@mui/icons-material';
import {
    Divider,
    IconButton,
    Modal,
    Stack,
    styled,
    Typography,
    lightTheme,
    Tabs,
} from '@semoss/ui';
import {
    BaseSettingSection,
    ColorSettings,
    JsonSettings,
    SelectInputSettings,
    SizeSettings,
} from '@/components/block-settings';

import { ThemeBlockDef, ThemeBlock } from './ThemeBlock';
import { BLOCK_TYPE_THEME } from '../block-defaults.constants';

export const DefaultStyles: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    gap: '8px',
    fontFamily: 'roboto',
};

const StyledModalHeader = styled(Stack)(({ theme }) => ({
    padding: theme.spacing(2),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
}));

const StyledTabBox = styled(Stack)(({ theme }) => ({
    borderRadius: '12px',
    backgroundColor: theme.palette.background.paper,
}));

const capitalize = (s) => {
    return String(s[0]).toUpperCase() + String(s).slice(1);
};

// export the config for the block
export const config: BlockConfig<ThemeBlockDef> = {
    widget: 'theme',
    type: BLOCK_TYPE_THEME,
    data: {
        theme: lightTheme,
        themeType: 'light',
    },
    listeners: {},
    slots: {
        children: [],
    },
    render: ThemeBlock,
    icon: FileCopyOutlined,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Theme Type',
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            options={[
                                {
                                    value: 'light',
                                    display: 'Light',
                                },
                                {
                                    value: 'dark',
                                    display: 'Dark',
                                },
                            ]}
                            label="Theme Type"
                            path="themeType"
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [
        {
            name: 'Theme colors',
            children: [
                {
                    description: 'Theme colors',
                    render: ({ id }) => {
                        const [selectedFirstTab, setSelectedFirstTab] =
                            useState<string>('primary');
                        const [selectedSecondtTab, setSelectedSecondTab] =
                            useState<string>('warning');
                        const firstTabSet = ['primary', 'secondary', 'error'];
                        const secondTabSet = ['warning', 'info', 'success'];
                        return (
                            <StyledTabBox gap={2}>
                                <Tabs
                                    value={selectedFirstTab}
                                    onChange={(_, value: string) => {
                                        setSelectedFirstTab(value);
                                    }}
                                    color="primary"
                                >
                                    {firstTabSet.map((key, idx: number) => (
                                        <Tabs.Item
                                            key={`${key}-${idx}`}
                                            label={capitalize(key)}
                                            value={key}
                                        />
                                    ))}
                                </Tabs>
                                <>
                                    <ColorSettings
                                        id={id}
                                        label="Main Color"
                                        path={`theme.palette.${selectedFirstTab}.main`}
                                    />
                                    <ColorSettings
                                        id={id}
                                        label="Dark Color"
                                        path={`theme.palette.${selectedFirstTab}.dark`}
                                    />
                                    <ColorSettings
                                        id={id}
                                        label="Light Color"
                                        path={`theme.palette.${selectedFirstTab}.light`}
                                    />
                                </>
                                <Tabs
                                    value={selectedSecondtTab}
                                    onChange={(_, value: string) => {
                                        setSelectedSecondTab(value);
                                    }}
                                    color="primary"
                                >
                                    {secondTabSet.map((key, idx: number) => (
                                        <Tabs.Item
                                            key={`${key}-${idx}`}
                                            label={capitalize(key)}
                                            value={key}
                                        />
                                    ))}
                                </Tabs>
                                <>
                                    <ColorSettings
                                        id={id}
                                        label="Main Color"
                                        path={`theme.palette.${selectedSecondtTab}.main`}
                                    />
                                    <ColorSettings
                                        id={id}
                                        label="Dark Color"
                                        path={`theme.palette.${selectedSecondtTab}.dark`}
                                    />
                                    <ColorSettings
                                        id={id}
                                        label="Light Color"
                                        path={`theme.palette.${selectedSecondtTab}.light`}
                                    />
                                </>
                            </StyledTabBox>
                        );
                    },
                },
            ],
        },
        {
            name: 'Text and Background',
            children: [
                {
                    description: 'Text and Background',
                    render: ({ id }) => {
                        const [selectedFirstTab, setSelectedFirstTab] =
                            useState<string>('text');
                        const firstTabSet = ['text', 'background'];
                        return (
                            <StyledTabBox gap={2}>
                                <Tabs
                                    value={selectedFirstTab}
                                    onChange={(_, value: string) => {
                                        setSelectedFirstTab(value);
                                    }}
                                    color="primary"
                                >
                                    {firstTabSet.map((key, idx: number) => (
                                        <Tabs.Item
                                            key={`${key}-${idx}`}
                                            label={capitalize(key)}
                                            value={key}
                                        />
                                    ))}
                                </Tabs>
                                {selectedFirstTab == 'background' && (
                                    <>
                                        <ColorSettings
                                            id={id}
                                            label="Default Color"
                                            path={`theme.palette.${selectedFirstTab}.default`}
                                        />
                                        <ColorSettings
                                            id={id}
                                            label="Paper Color"
                                            path={`theme.palette.${selectedFirstTab}.paper`}
                                        />
                                    </>
                                )}
                                {selectedFirstTab == 'text' && (
                                    <>
                                        <ColorSettings
                                            id={id}
                                            label="Primary Color"
                                            path={`theme.palette.${selectedFirstTab}.primary`}
                                        />
                                        <ColorSettings
                                            id={id}
                                            label="Main Color"
                                            path={`theme.palette.${selectedFirstTab}.main`}
                                        />
                                        <ColorSettings
                                            id={id}
                                            label="Secondary Color"
                                            path={`theme.palette.${selectedFirstTab}.secondary`}
                                        />
                                        <ColorSettings
                                            id={id}
                                            label="Disabled Color"
                                            path={`theme.palette.${selectedFirstTab}.disabled`}
                                        />
                                    </>
                                )}
                            </StyledTabBox>
                        );
                    },
                },
            ],
        },
        {
            name: 'Spacing',
            children: [
                {
                    description: 'Spacing',
                    render: ({ id }) => (
                        <SizeSettings
                            id={id}
                            label="Spacing"
                            path="theme.spacing"
                        />
                    ),
                },
            ],
        },
        {
            name: 'MUI Theme Editor',
            children: [
                {
                    description: 'Edit MUI Theme',
                    render: ({ id }) => {
                        const [open, setOpen] = useState(false);
                        return (
                            <>
                                <BaseSettingSection label={'Edit MUI Theme'}>
                                    <IconButton
                                        size="small"
                                        onClick={() => setOpen(true)}
                                    >
                                        <OpenInNew />
                                    </IconButton>
                                </BaseSettingSection>
                                <Modal open={open} fullWidth maxWidth={'lg'}>
                                    <StyledModalHeader>
                                        <Typography variant="h5">{`Edit MUI theme`}</Typography>
                                        <IconButton
                                            onClick={() => setOpen(false)}
                                        >
                                            <Close />
                                        </IconButton>
                                    </StyledModalHeader>
                                    <Divider />
                                    <Modal.Content>
                                        <JsonSettings
                                            id={id}
                                            path="theme"
                                            height="500px"
                                        />
                                    </Modal.Content>
                                </Modal>
                            </>
                        );
                    },
                },
            ],
        },
    ],
};
