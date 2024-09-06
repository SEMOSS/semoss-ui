import React from "react";
import { Breadcrumbs } from ".";
import { Stack } from "../..";
import { StarOutlined } from "@mui/icons-material";

export default {
    title: "Components/Breadcrumbs",
    component: Breadcrumbs,
    args: {
        maxItems: 6,
    },
    argTypes: {
        maxItems: {
            options: [1, 2, 3, 4, 5, 6],
        },
        itemsAfterCollapse: {
            options: [1, 2, 3],
        },
        itemsBeforeCollapse: {
            options: [1, 2, 3],
        },
        separator: {
            options: ["/", ">", "-"],
            control: { type: "select" },
        },
    },
};

const Template = (args) => {
    return (
        <Stack spacing={2}>
            <Breadcrumbs {...args}>
                <Breadcrumbs.Item href="#" underline="hover" color="inherit">
                    Link 1
                </Breadcrumbs.Item>
                <Breadcrumbs.Item href="#" underline="hover" color="inherit">
                    Link 2
                </Breadcrumbs.Item>
                <Breadcrumbs.Item href="#" underline="hover" color="inherit">
                    Link 3
                </Breadcrumbs.Item>
                <Breadcrumbs.Item href="#" underline="hover" color="inherit">
                    Link 4
                </Breadcrumbs.Item>
                <Breadcrumbs.Item href="#" underline="hover" color="inherit">
                    Link 5
                </Breadcrumbs.Item>
                <Breadcrumbs.Item href="#" underline="hover" color="inherit">
                    Link 6
                </Breadcrumbs.Item>
            </Breadcrumbs>
            <Breadcrumbs maxItems={2}>
                <Breadcrumbs.Item href="#" underline="hover" color="inherit">
                    Link 1
                </Breadcrumbs.Item>
                <Breadcrumbs.Item href="#" underline="hover" color="inherit">
                    Link 2
                </Breadcrumbs.Item>
                <Breadcrumbs.Item href="#" underline="hover" color="inherit">
                    Link 3
                </Breadcrumbs.Item>
            </Breadcrumbs>
            <Breadcrumbs maxItems={2}>
                <Breadcrumbs.Item href="#" underline="hover" color="inherit">
                    <StarOutlined
                        sx={{ fontSize: "1rem", mr: 0.5 }}
                    ></StarOutlined>
                    Link 1
                </Breadcrumbs.Item>
                <Breadcrumbs.Item href="#" underline="hover" color="inherit">
                    <StarOutlined
                        sx={{ fontSize: "1rem", mr: 0.5 }}
                    ></StarOutlined>
                    Link 2
                </Breadcrumbs.Item>
                <Breadcrumbs.Item href="#" underline="hover" color="inherit">
                    <StarOutlined
                        sx={{ fontSize: "1rem", mr: 0.5 }}
                    ></StarOutlined>
                    Link 3
                </Breadcrumbs.Item>
            </Breadcrumbs>
        </Stack>
    );
};

export const Default = Template.bind({});
