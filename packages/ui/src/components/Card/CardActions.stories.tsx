import type { Meta, StoryObj } from "@storybook/react";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import { Card } from "./index";

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
                        <AccessTimeIcon />
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
                        <MoreVertIcon />
                    </IconButton>
                </div>
            </div>
        </Card.Actions>
    ),
};
