import type { Meta, StoryObj } from "@storybook/react";
import { List } from "../List";
import Icons from "../Icons";
import { Box } from "../Box";
import React from "react";

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
                            <Icons.StarOutlined />
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
                            <Icons.StartRounded />
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
                            <Icons.FilterRounded />
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
