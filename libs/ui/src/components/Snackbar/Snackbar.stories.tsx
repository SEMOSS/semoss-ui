import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Close } from "@mui/icons-material";
import { Button, IconButton } from "../..";
import { Snackbar } from ".";

const meta: Meta<typeof Snackbar> = {
    title: "Components/Snackbar",
    component: Snackbar,
    args: {
        anchorOrigin: {
            vertical: "bottom",
            horizontal: "center",
        },
        autoHideDuration: 3000,
    },
};

export default meta;

type Story = StoryObj<typeof Snackbar>;

function SimpleSnackbar(args) {
    const [open, setOpen] = useState(false);

    const handleClick = () => {
        setOpen(true);
    };

    const handleClose = (event, reason) => {
        if (reason === "clickaway") {
            return;
        }

        setOpen(false);
    };

    const action = (
        <>
            <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={(e) => handleClose(e, "none")}
            >
                <Close fontSize="small" />
            </IconButton>
        </>
    );

    return (
        <div>
            <Button onClick={handleClick}>Open simple snackbar</Button>
            <Snackbar
                open={open}
                onClose={handleClose}
                message="Note archived"
                action={action}
                {...args}
            />
        </div>
    );
}

export const Default: Story = {
    render: (args) => <SimpleSnackbar {...args} />,
};
