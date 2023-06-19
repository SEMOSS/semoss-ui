import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Divider } from "../Divider/index";
import { Box } from "../Box/index";

const meta: Meta<typeof Divider> = {
    title: "Components/Divider",
    component: Divider,
    args: {
        textAlign: "center",
        light: true,
        variant: "fullWidth",
        orientation: "horizontal",
    },
    argTypes: {
        textAlign: {
            options: ["left", "right", "center"],
        },
        orientation: {
            options: ["horizontal", "vertical"],
        },
        variant: {
            options: ["inset", "fullWidth", "middle"],
        },
    },
};

export default meta;

type Story = StoryObj<typeof Divider>;

export const Default: Story = {
    render: (args) => (
        <Box>
            {args.orientation === "horizontal" ? (
                <Box sx={{ height: "100%", width: "100%" }}>
                    <Box sx={{ positoin: "fixed", top: "50%", left: "50%" }}>
                        <Box sx={{ height: "250px" }} />
                        <Divider {...args} orientation="horizontal" />
                    </Box>
                </Box>
            ) : (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        "& svg": {
                            m: 1.5,
                        },
                        "& hr": {
                            mx: 0.5,
                        },
                        paddingLeft: 12,
                        height: "550px",
                    }}
                >
                    <Divider {...args} orientation="vertical" />
                </Box>
            )}
        </Box>
    ),
};
