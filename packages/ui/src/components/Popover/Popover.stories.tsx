import { useState, MouseEvent } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Popover } from "../Popover/index";
import { Button } from "../Button/index";
import { Box } from "../Box/index";
import React from "react";

const meta: Meta<typeof Popover> = {
    title: "Components/Popover",
    component: Popover,
};

export default meta;

type Story = StoryObj<typeof Popover>;

const PopoverButton = () => {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [anchorEl2, setAnchorEl2] = useState<HTMLButtonElement | null>(null);

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClick2 = (event: MouseEvent<HTMLButtonElement>) => {
        setAnchorEl2(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };
    const handleClose2 = () => {
        setAnchorEl2(null);
    };

    const open = Boolean(anchorEl);
    const open2 = Boolean(anchorEl2);
    const id = open ? "simple-popover" : undefined;
    const id2 = open ? "simple-popover" : undefined;

    return (
        <Box sx={{ display: "flex", gap: 4 }}>
            <Button
                aria-describedby={id}
                variant="outlined"
                onClick={handleClick}
            >
                Click Me
            </Button>
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                }}
            >
                <Box sx={{ padding: 2 }}>
                    The content of the Popover (anchor origin bottom-left).
                </Box>
            </Popover>
            <Button
                aria-describedby={id2}
                variant="outlined"
                onClick={handleClick2}
            >
                Click Me
            </Button>
            <Popover
                id={id2}
                open={open2}
                anchorEl={anchorEl2}
                onClose={handleClose2}
                anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
            >
                <Box sx={{ padding: 2 }}>
                    The content of the Popover (anchor origin top-right).
                </Box>
            </Popover>
        </Box>
    );
};

export const Default: Story = {
    render: () => <PopoverButton />,
};
