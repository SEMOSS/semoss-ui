import type { Meta, StoryObj } from "@storybook/react";
import { Container } from "./index";

const meta: Meta<typeof Container> = {
    title: "Components/Container",
    component: Container,
};

export default meta;

type Story = StoryObj<typeof Container>;

export const Default: Story = {
    render: () => <Container sx={{ border: 1 }}>Container</Container>,
};
