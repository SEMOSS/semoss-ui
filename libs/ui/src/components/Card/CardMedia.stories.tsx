import type { Meta, StoryObj } from "@storybook/react";

import { Card } from "./index";
import img from "./placeholder.png";

const meta: Meta<typeof Card> = {
    title: "Components/Card/Card.Media",
    component: Card.Media,
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Primary: Story = {
    render: () => <Card.Media image={img} sx={{ height: "250px" }} />,
};
