import React, { useState, SyntheticEvent } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Tabs } from "../Tabs/index";
import { Box } from "../Box/index";
import { Tab } from "../Tabs/index";

const meta: Meta<typeof Tabs> = {
    title: "Components/Tabs",
    component: Tabs,
    args: {
        centered: false,
        indicatorColor: "primary",
        orientation: "horizontal",
        textColor: "primary",
        variant: "standard",
    },
    argTypes: {
        indicatorColor: {
            options: ["secondary", "primary"],
            control: { type: "select" },
        },
        textColor: {
            options: ["secondary", "primary", "inherit"],
            control: { type: "select" },
        },
        orientation: {
            options: ["horizontal", "vertical"],
            control: { type: "radio" },
        },
        variant: {
            options: ["standard", "scrollable", "fullWidth"],
            control: { type: "radio" },
        },
    },
};

export default meta;

type Story = StoryObj<typeof Tabs>;

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    <div>{children}</div>
                </Box>
            )}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        "aria-controls": `simple-tabpanel-${index}`,
    };
}

function BasicTabs(args) {
    const [value, setValue] = useState(0);

    const handleChange = (event: SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: "100%" }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs
                    {...args}
                    value={value}
                    onChange={handleChange}
                    aria-label="basic tabs example"
                    textColor="secondary"
                    indicatorColor="secondary"
                >
                    <Tab label="Item One" {...a11yProps(0)} />
                    <Tab label="Item Two" {...a11yProps(1)} />
                    <Tab label="Item Three" {...a11yProps(2)} />
                </Tabs>
            </Box>
            <TabPanel value={value} index={0}>
                Item One
            </TabPanel>
            <TabPanel value={value} index={1}>
                Item Two
            </TabPanel>
            <TabPanel value={value} index={2}>
                Item Three
            </TabPanel>
        </Box>
    );
}

export const Default: Story = {
    render: (args) => <BasicTabs {...args} />,
};
