import { CSSProperties, useState } from "react";
import { Close, FileCopyOutlined, OpenInNew } from "@mui/icons-material";

import {
    Divider,
    IconButton,
    Modal,
    Stack,
    styled,
    Typography,
    lightTheme,
    Tabs,
    Select,
    darkTheme,
    MenuItem,
} from "@semoss/ui";

import { BlockConfig } from "../../../store";
import { useBlockSettings } from "../../../hooks";
import {
    BaseSettingSection,
    ColorSettings,
    JsonSettings,
    SizeSettings,
} from "../../block-settings";

import { ThemeBlockDef, ThemeBlock } from "./ThemeBlock";
import { BLOCK_TYPE_THEME } from "../block-defaults.constants";
import { buildShowField} from "../block-defaults.shared";

export const DefaultStyles: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    padding: "24px",
    gap: "8px",
    fontFamily: "roboto",
};

const StyledModalHeader = styled(Stack)(({ theme }) => ({
    padding: theme.spacing(2),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
}));

const StyledTabBox = styled(Stack)(({ theme }) => ({
    borderRadius: "12px",
    backgroundColor: theme.palette.background.paper,
}));

const capitalize = (s) => {
    return String(s[0]).toUpperCase() + String(s).slice(1);
};

// export the config for the block
export const config: BlockConfig<ThemeBlockDef> = {
    widget: "theme",
    type: BLOCK_TYPE_THEME,
    data: {
        theme: lightTheme,
    },
    listeners: {},
    slots: {
        children: [],
    },
    render: ThemeBlock,
    icon: FileCopyOutlined,
    contentMenu: [
        {
            name: "Theme Type",
            children: [
                {
                    description: "Theme Type",
                    render: ({ id }) => {
                        const { setData } = useBlockSettings(id);
                        const [themeType, setThemeType] =
                            useState<string>("light");
                        const options = [
                            {
                                value: "light",
                                display: "Light",
                            },
                            {
                                value: "dark",
                                display: "Dark",
                            },
                        ];
                        const onChange = (value: string) => {
                            setThemeType(value);
                            setData(
                                "theme",
                                value === "light" ? lightTheme : darkTheme,
                            );
                        };
                        return (
                            <Select
                                fullWidth
                                size="small"
                                value={themeType}
                                onChange={(e) => {
                                    onChange(e.target.value);
                                }}
                            >
                                {Array.from(options, (option, i) => {
                                    return (
                                        <MenuItem key={i} value={option.value}>
                                            {option.display}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        );
                    },
                },
            ],
        },
    ],
    styleMenu: [
        {
            name: "Theme colors",
            children: [
                {
                    description: "Theme colors",
                    render: ({ id }) => {
                        const [selectedFirstTab, setSelectedFirstTab] =
                            useState<string>("primary");
                        const [selectedSecondtTab, setSelectedSecondTab] =
                            useState<string>("warning");
                        const firstTabSet = ["primary", "secondary", "error"];
                        const secondTabSet = ["warning", "info", "success"];
                        const variants = ["main", "dark", "light"];
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
                                    {variants.map((variant, idx: number) => (
                                        <ColorSettings
                                            key={`${variant}-${idx}`}
                                            id={id}
                                            label={`${capitalize(
                                                variant,
                                            )} Color`}
                                            path={`theme.palette.${selectedFirstTab}.${variant}`}
                                        />
                                    ))}
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
                                    {variants.map((variant, idx: number) => (
                                        <ColorSettings
                                            key={`${variant}-${idx}`}
                                            id={id}
                                            label={`${capitalize(
                                                variant,
                                            )} Color`}
                                            path={`theme.palette.${selectedSecondtTab}.${variant}`}
                                        />
                                    ))}
                                </>
                            </StyledTabBox>
                        );
                    },
                },
            ],
        },
        {
            name: "Text and Background",
            children: [
                {
                    description: "Text and Background",
                    render: ({ id }) => {
                        const [selectedFirstTab, setSelectedFirstTab] =
                            useState<string>("text");
                        const firstTabSet = ["text", "background"];
                        const paperVariants = ["paper", "default"];
                        const textVariants = [
                            "primary",
                            "secondary",
                            "disabled",
                            "main",
                        ];
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
                                {selectedFirstTab == "background" && (
                                    <>
                                        {paperVariants.map(
                                            (variant, idx: number) => (
                                                <ColorSettings
                                                    key={`${variant}-${idx}`}
                                                    id={id}
                                                    label={`${capitalize(
                                                        variant,
                                                    )} Color`}
                                                    path={`theme.palette.${selectedFirstTab}.${variant}`}
                                                />
                                            ),
                                        )}
                                    </>
                                )}
                                {selectedFirstTab == "text" && (
                                    <>
                                        {textVariants.map(
                                            (variant, idx: number) => (
                                                <ColorSettings
                                                    key={`${variant}-${idx}`}
                                                    id={id}
                                                    label={`${capitalize(
                                                        variant,
                                                    )} Color`}
                                                    path={`theme.palette.${selectedFirstTab}.${variant}`}
                                                />
                                            ),
                                        )}
                                    </>
                                )}
                            </StyledTabBox>
                        );
                    },
                },
            ],
        },
        {
            name: "Spacing",
            children: [
                {
                    description: "Spacing",
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
            name: "MUI Theme Editor",
            children: [
                {
                    description: "Edit MUI Theme",
                    render: ({ id }) => {
                        const [open, setOpen] = useState(false);
                        return (
                            <>
                                <BaseSettingSection label={"Edit MUI Theme"}>
                                    <IconButton
                                        size="small"
                                        onClick={() => setOpen(true)}
                                        disabled={false}
                                    >
                                        <OpenInNew />
                                    </IconButton>
                                </BaseSettingSection>
                                <Modal open={open} fullWidth maxWidth={"lg"}>
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
                                            callback={() => setOpen(false)}
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
