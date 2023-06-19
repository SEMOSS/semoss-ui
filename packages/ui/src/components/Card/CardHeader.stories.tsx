import type { Meta, StoryObj } from "@storybook/react";
import IconButton from "@mui/material/IconButton";
import PersonIcon from "@mui/icons-material/Person";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import Icon from "@mui/material/Icon";

import { Avatar } from "../Avatar/index";
import { Card } from "./index";

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
                                <PersonIcon />
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
                    <StarBorderIcon />
                </IconButton>
            }
        />
    ),
};
