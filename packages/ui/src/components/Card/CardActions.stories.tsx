import type { Meta, StoryObj } from "@storybook/react";
import { MoreVert, AccessTime } from "@mui/icons-material";
import { IconButton } from "../../";

import { Card } from "./";

const meta: Meta<typeof Card> = {
    title: "Components/Card/Card.Actions",
    component: Card.Actions,
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Primary: Story = {
    render: () => (
        <Card.Actions>
            <div
                style={{
                    display: "flex",
                    gap: 1,
                    justifyContent: "space-between",
                    width: "100%",
                }}
            >
                <div>
                    <IconButton aria-label="action">
                        <AccessTime />
                    </IconButton>
                    <span
                        style={{
                            fontSize: "12px",
                            opacity: 0.7,
                            marginTop: 12,
                        }}
                    >
                        Updated May 8th, 2023 12...
                    </span>
                </div>
                <div>
                    <IconButton>
                        <MoreVert />
                    </IconButton>
                </div>
            </div>
        </Card.Actions>
    ),
};
