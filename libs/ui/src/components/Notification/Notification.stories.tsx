import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Notification, useNotification } from ".";
import { Button } from "../Button/index";

const meta: Meta<typeof Notification> = {
    title: "Components/Notification",
    component: Notification,
};

export default meta;

type Story = StoryObj<typeof Notification>;

const Outer = (props) => {
    const { children } = props;
    return <Notification>{children}</Notification>;
};

const Inner = () => {
    const notification = useNotification();

    return (
        <Notification>
            <Button
                variant="outlined"
                onClick={() =>
                    notification.add({
                        color: "success",
                        message: `Hello--${Math.floor(Math.random() * 1000)}`,
                    })
                }
            >
                Open Notification
            </Button>
        </Notification>
    );
};

export const Default: Story = {
    render: (args) => (
        <Outer {...args}>
            <Inner />
        </Outer>
    ),
};
