import React, { useEffect, useState, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Backdrop } from "./index";
import { Box } from "../Box/index";
import { LinearProgress } from "../LinearProgress/index";

const meta: Meta<typeof Backdrop> = {
    title: "Components/Backdrop",
    component: Backdrop,
    args: {
        open: true,
    },
    argTypes: {
        open: {
            options: [true, false],
            control: { type: "select" },
        },
    },
};

export default meta;

type Story = StoryObj<typeof Backdrop>;

const LinearBuffer = () => {
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
            />
        </Box>
    );
};

export const Default: Story = {
    render: (args) => (
        <>
            <Backdrop sx={{ zIndex: 10 }} {...args}>
                <Box>Backdrop Children</Box>
            </Backdrop>
            <Box sx={{ p: 2, border: "1px dashed grey" }}>Page Content</Box>
        </>
    ),
};

export const LoadingExample: Story = {
    render: () => (
        <>
            <Backdrop open={true} sx={{ zIndex: 10 }}>
                <LinearBuffer />
            </Backdrop>
            <Box sx={{ p: 2, border: "1px dashed grey" }}>Page Content</Box>
        </>
    ),
};
