import { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { CircularProgress } from "../CircularProgress/index";

const meta: Meta<typeof CircularProgress> = {
    title: "Components/CircularProgress",
    component: CircularProgress,
};

export default meta;

type Story = StoryObj<typeof CircularProgress>;

const CircularDeterminate = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((prevProgress) =>
                prevProgress >= 100 ? 0 : prevProgress + 10,
            );
        }, 800);

        return () => {
            clearInterval(timer);
        };
    }, []);
    return <CircularProgress variant="determinate" value={progress} />;
};

export const Default: Story = {
    render: () => <CircularProgress />,
};

export const Determinate: Story = {
    render: () => <CircularDeterminate />,
};
