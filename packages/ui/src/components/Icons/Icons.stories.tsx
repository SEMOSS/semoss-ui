import type { Meta, StoryObj } from "@storybook/react";
import { Icon } from "../Icon/index";
import { Grid } from "../Grid/index";
import { Card } from "../Card/index";
import { Tooltip } from "../Tooltip/index";
import Icons from "./";

const meta: Meta<typeof Icon> = {
    title: "Components/Icons",
    component: Icon,
};

export default meta;

type Story = StoryObj<typeof Icon>;

export const Primary: Story = {
    render: () => (
        <Card sx={{ width: "75%", backgroundColor: "#eee" }}>
            <Card.Content>
                <Grid
                    container
                    spacing={4}
                    justifyContent="center"
                    alignItems="center"
                    direction="row"
                >
                    {Object.keys(Icons).map((val, idx) => {
                        const _Icon = Icons[val];
                        return (
                            <Grid
                                item
                                xs={1}
                                sx={{
                                    justifyContent: "center",
                                    alignContent: "center",
                                }}
                                key={idx}
                            >
                                <Tooltip title={val} key={idx}>
                                    <_Icon sx={{ fontSize: "3rem" }} />
                                </Tooltip>
                            </Grid>
                        );
                    })}
                </Grid>
            </Card.Content>
        </Card>
    ),
};
