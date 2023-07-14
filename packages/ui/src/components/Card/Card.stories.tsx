import type { Meta, StoryObj } from "@storybook/react";
import { MoreVert, Person, AccessTime, StarBorder } from "@mui/icons-material";
import { IconButton, Icon, Chip, Avatar } from "../../";
import { Card } from "./";
import img from "./placeholder.png";

const meta: Meta<typeof Card> = {
    title: "Components/Card",
    component: Card,
    subcomponents: {
        Content: Card.Content,
        Header: Card.Header,
    },
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Primary: Story = {
    render: () => (
        <Card sx={{ width: "35%", height: "480px" }}>
            <Card.Media image={img} sx={{ height: "250px" }} />
            <Card.Header
                title="AHLTA MILESTONES"
                subheader={
                    <>
                        <div
                            style={{
                                display: "flex",
                                gap: 10,
                                marginTop: "12px",
                            }}
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
        </Card>
    ),
};
