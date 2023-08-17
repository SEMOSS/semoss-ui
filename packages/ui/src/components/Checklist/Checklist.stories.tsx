import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { StarOutlined } from "@mui/icons-material";
import { Box } from "../../";
import { Checklist } from "./";

const meta: Meta<typeof Checklist> = {
    title: "Components/Checklist",
    component: Checklist,
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

type Story = StoryObj<typeof Checklist>;

export const Default: Story = {
    render: (args) => (
        <Box sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}>
            <Checklist {...args}>
                <Checklist.Item divider>
                    <Checklist.ItemButton />

                    <Checklist.ItemText primary="(Select All)" />
                </Checklist.Item>

                <Checklist.Item divider secondaryAction={<StarOutlined />}>
                    <Checklist.ItemButton />

                    <Checklist.ItemText
                        primary="Primary text"
                        secondary="Secondary text"
                    />
                </Checklist.Item>

                {[1, 2, 3, 4, 5].map((v) => {
                    return (
                        <Checklist.Item key={v} divider>
                            <Checklist.ItemButton />

                            <Checklist.ItemText
                                primary={`Primary text ${v}`}
                                secondary={`Secondary text ${v}`}
                            />
                        </Checklist.Item>
                    );
                })}
            </Checklist>
        </Box>
    ),
};
