import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "./index";

const meta: Meta<typeof Box> = {
    title: "Components/Box",
    component: Box,
};

export default meta;

type Story = StoryObj<typeof Box>;

export const Default: Story = {
    render: () => <Box sx={{ border: 1 }}>Box with border</Box>,
};
