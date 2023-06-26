import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Alert } from "../Alert/index";

const meta: Meta<typeof Alert.Title> = {
    title: "Components/Alert/Alert.Title",
    component: Alert.Title,
    args: {
        children: "Lorem Ipsum",
    },
};

export default meta;

type Story = StoryObj<typeof Alert.Title>;

export const Default: Story = {
    render: (args) => <Alert.Title {...args} />,
};
