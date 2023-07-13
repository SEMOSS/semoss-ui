import type { Meta, StoryObj } from "@storybook/react";
import { Person, StarBorder } from "@mui/icons-material";
import { Avatar, Icon, IconButton } from "../../";
import { Card } from "./";

const meta: Meta<typeof Card> = {
    title: "Components/Card/Card.Header",
    component: Card.Header,
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Primary: Story = {
    render: () => (
        <Card.Header
            title="AHLTA MILESTONES"
            subheader={
                <>
                    <div
                        style={{ display: "flex", gap: 10, marginTop: "12px" }}
                    >
                        <Avatar
                            aria-label="avatar"
                            sx={{ width: "24px", height: "24px" }}
                        >
                            <Icon>
                                <Person />
                            </Icon>
                        </Avatar>
                        <span
                            style={{
                                opacity: 0.7,
                                fontSize: "12px",
                                marginTop: 4,
                            }}
                        >
                            Published by: j.smith
                        </span>
                    </div>
                </>
            }
            action={
                <IconButton aria-label="settings">
                    <StarBorder />
                </IconButton>
            }
        />
    ),
};
