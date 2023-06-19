import type { Meta, StoryObj } from "@storybook/react";
import { Alert } from "../Alert/index";

const meta: Meta<typeof Alert> = {
    title: "Components/Alert",
    component: Alert,
    subcomponents: {
        Title: Alert.Title,
    },
    args: {
        severity: "success",
    },
    argTypes: {
        severity: {
            options: ["success", "error", "info", "warning"],
            control: { type: "select" },
        },
    },
};

export default meta;

type Story = StoryObj<typeof Alert>;

export const Default: Story = {
    render: (args) => (
        <Alert {...args}>
            <>
                <Alert.Title>Alert Title</Alert.Title>
                Lorem Ipsum
            </>
        </Alert>
    ),
};
