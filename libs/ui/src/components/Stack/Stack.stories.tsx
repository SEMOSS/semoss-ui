import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Stack } from "./index";
import { Alert } from "../Alert/index";

const meta: Meta<typeof Stack> = {
    title: "Components/Stack",
    component: Stack,
    args: {
        spacing: 1,
        direction: "column",
    },
    argTypes: {
        spacing: {
            options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            control: { type: "select" },
        },
        direction: {
            options: ["column-reverse", "column", "row-reverse", "row"],
            control: { type: "select" },
        },
    },
};

export default meta;

type Story = StoryObj<typeof Stack>;

export const Default: Story = {
    render: (args) => (
        <>
            <Stack {...args}>
                <Alert>Stack Item #1</Alert>
                <Alert color="warning">Stack Item #2</Alert>
                <Alert color="error">Stack Item #3</Alert>
                <Alert color="info">Stack Item #4</Alert>
            </Stack>
        </>
    ),
};
