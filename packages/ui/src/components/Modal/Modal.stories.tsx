import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Modal } from "../Modal/index";
import { Button } from "../Button/index";

const meta: Meta<typeof Modal> = {
    title: "Components/Modal",
    component: Modal,
    args: {
        open: true,
    },
    argTypes: {
        open: {
            options: [true, false],
            control: { type: "radio" },
        },
        maxWidth: {
            options: ["xs", "sm", "md", "lg", "xl"],
            control: { type: "select" },
        },
        fullWidth: {
            options: [true, false],
            control: { type: "radio" },
        },
    },
};

export default meta;

type Story = StoryObj<typeof Modal>;

const Example = (args: typeof meta) => {
    const [open, setOpen] = useState(false);

    const content = (
        <div>
            {
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
            }
        </div>
    );

    return (
        <>
            <Button variant="outlined" onClick={() => setOpen(true)}>
                Open Modal
            </Button>
            <Modal {...args} open={open}>
                <Modal.Title>Modal Title</Modal.Title>
                <Modal.Content>
                    <Modal.ContentText>{content}</Modal.ContentText>
                </Modal.Content>
                <Modal.Actions>
                    <Button variant="text" onClick={() => setOpen(false)}>
                        Close
                    </Button>
                </Modal.Actions>
            </Modal>
        </>
    );
};

export const Default: Story = {
    render: (args) => <Example {...args} />,
};
