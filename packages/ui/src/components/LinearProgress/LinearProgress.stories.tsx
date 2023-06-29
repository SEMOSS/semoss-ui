import { useEffect, useState, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { LinearProgress } from "../LinearProgress/index";
import { Box } from "../Box/index";
import Stack from "@mui/material/Stack";
import React from "react";

const meta: Meta<typeof LinearProgress> = {
    title: "Components/LinearProgress",
    component: LinearProgress,
    args: {
        color: "primary",
    },
    argTypes: {
        color: {
            options: [
                "inherit",
                "secondary",
                "primary",
                "error",
                "info",
                "success",
                "warning",
            ],
            control: { type: "select" },
        },
    },
};

export default meta;

type Story = StoryObj<typeof LinearProgress>;

const LinearBuffer = (args) => {
    const [progress, setProgress] = useState(0);
    const [buffer, setBuffer] = useState(10);

    const progressRef = useRef(() => {
        return;
    });

    useEffect(() => {
        progressRef.current = () => {
            if (progress > 100) {
                setProgress(0);
                setBuffer(10);
            } else {
                const diff = Math.random() * 10;
                const diff2 = Math.random() * 10;
                setProgress(progress + diff);
                setBuffer(progress + diff + diff2);
            }
        };
    });

    useEffect(() => {
        const timer = setInterval(() => {
            progressRef.current();
        }, 500);

        return () => {
            clearInterval(timer);
        };
    }, []);

    return (
        <Box sx={{ width: "100%" }}>
            <LinearProgress
                variant="buffer"
                value={progress}
                valueBuffer={buffer}
                {...args}
            />
        </Box>
    );
};

export const Default: Story = {
    render: (args) => (
        <Stack sx={{ width: "100%" }} spacing={2}>
            <LinearProgress {...args} />
        </Stack>
    ),
};

export const Buffer: Story = {
    render: (args) => (
        <Stack sx={{ width: "100%" }} spacing={2}>
            <LinearBuffer {...args} />
        </Stack>
    ),
};
