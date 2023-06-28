import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Grid } from "../Grid/index";
import { Box } from "../Box/index";
import { Card } from "../Card/index";

const meta: Meta<typeof Grid> = {
    title: "Components/Grid",
    component: Grid,
    args: {
        xs: 4,
    },
};

export default meta;

type Story = StoryObj<typeof Grid>;

export const Default: Story = {
    render: (args) => (
        <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={2} {...args}>
                <Grid item>
                    <Card>
                        <Card.Content>
                            <Card.Header
                                title="variable"
                                subheader="grid item"
                            />
                        </Card.Content>
                    </Card>
                </Grid>
                <Grid item xs={4}>
                    <Card>
                        <Card.Content>
                            <Card.Header title="xs=4" subheader="grid item" />
                        </Card.Content>
                    </Card>
                </Grid>
                <Grid item xs={4}>
                    <Card>
                        <Card.Content>
                            <Card.Header title="xs=4" subheader="grid item" />
                        </Card.Content>
                    </Card>
                </Grid>
                <Grid item xs={8}>
                    <Card>
                        <Card.Content>
                            <Card.Header title="xs=8" subheader="grid item" />
                        </Card.Content>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    ),
};
