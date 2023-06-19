import type { Meta, StoryObj } from "@storybook/react";

import { Card } from "./index";
import { Chip } from "../Chip/index";

const meta: Meta<typeof Card> = {
    title: "Components/Card/Card.Content",
    component: Card.Content,
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Primary: Story = {
    render: () => (
        <Card.Content sx={{ marginTop: -2 }}>
            <div>Card Content</div>
            <Chip
                label="Chip"
                variant="outlined"
                sx={{ marginTop: 1 }}
                size="small"
                clickable={true}
            />
        </Card.Content>
    ),
};
