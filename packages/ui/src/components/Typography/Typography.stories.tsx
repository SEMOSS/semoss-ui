import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Typography } from "../Typography/index";

const meta: Meta<typeof Typography> = {
    title: "Components/Typography",
    component: Typography,
    args: {
        variant: "h1",
    },
};

export default meta;

type Story = StoryObj<typeof Typography>;

export const Default: Story = {
    render: (args) => (
        <>
            <Typography {...args}> Words You Can Change</Typography>
            <Typography variant="body1">
                Body: Typography requires you import fontsource
            </Typography>
            <Typography variant="subtitle1">
                https://mui.com/material-ui/react-typography/
            </Typography>
        </>
    ),
};
