import React, { useState, SyntheticEvent } from "react";
import { ToggleGroup, Toggle } from "../ToggleGroup/index";
import { Box } from "../Box/index";

export default {
    title: "Components/ToggleGroup",
    component: ToggleGroup,
    args: {
        orientation: "horizontal",
    },
};

interface TogglePanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTogglePanel(props: TogglePanelProps) {
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

const Template = (args) => {
    const [value, setValue] = useState(0);

    const handleChange = (event: SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <Box>
            <ToggleGroup
                {...args}
                value={value}
                onChange={handleChange}
                aria-label="basic tabs example"
            >
                <Toggle label="Item One" />
                <Toggle label="Item Two" />
            </ToggleGroup>
            <CustomTogglePanel value={value} index={0}>
                Item One
            </CustomTogglePanel>
            <CustomTogglePanel value={value} index={1}>
                Item Two
            </CustomTogglePanel>
            <CustomTogglePanel value={value} index={2}>
                Item Three
            </CustomTogglePanel>
        </Box>
    );
};

export const Default = Template.bind({});
