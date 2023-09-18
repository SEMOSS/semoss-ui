import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { StarOutlined, StartRounded, FilterRounded } from "@mui/icons-material";
import { Box } from "../../";
import { List } from "./";

const meta: Meta<typeof List> = {
    title: "Components/List",
    component: List,
    args: {
        sx: {},
        disablePadding: false,
    },
    argTypes: {
        disablePadding: {
            options: [true, false],
        },
    },
};

export default meta;

type Story = StoryObj<typeof List>;

export const Default: Story = {
    render: (args) => (
        <Box sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}>
            <List {...args}>
                <List.Item
                    divider
                    secondaryAction={
                        <List.ItemButton
                            onClick={() => window.alert("Clicked star button")}
                        >
                            <StarOutlined />
                        </List.ItemButton>
                    }
                >
                    <List.ItemText
                        primary="Primary text"
                        secondary="Secondary text"
                    />
                </List.Item>
                <List.Item
                    divider
                    secondaryAction={
                        <List.ItemButton
                            onClick={() => window.alert("Clicked start button")}
                        >
                            <StartRounded />
                        </List.ItemButton>
                    }
                >
                    <List.ItemText
                        primary="Primary text"
                        secondary="Secondary text"
                    />
                </List.Item>
                <List.Item
                    divider
                    secondaryAction={
                        <List.ItemButton
                            onClick={() =>
                                window.alert("Clicked filter button")
                            }
                        >
                            <FilterRounded />
                        </List.ItemButton>
                    }
                >
                    <List.ItemText
                        primary="Primary text"
                        secondary="Secondary text"
                    />
                </List.Item>
            </List>
        </Box>
    ),
};
