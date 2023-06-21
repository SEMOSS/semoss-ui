import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Breadcrumbs } from "../Breadcrumbs/index";
import { Link } from "../Link/index";
import { Stack } from "../Stack/index";
import StarIcon from "@mui/icons-material/Star";

const meta: Meta<typeof Breadcrumbs> = {
    title: "Components/Breadcrumbs",
    component: Breadcrumbs,
    args: {
        children: () => <Link>Link 1</Link>,
        maxItems: 6,
    },
    argTypes: {
        maxItems: {
            options: [1, 2, 3, 4, 5, 6],
            control: { type: "select" },
        },
        itemsAfterCollapse: {
            options: [1, 2, 3],
            control: { type: "select" },
        },
        itemsBeforeCollapse: {
            options: [1, 2, 3],
            control: { type: "select" },
        },
        separator: {
            options: ["/", ">", "-"],
            control: { type: "select" },
        },
    },
};

export default meta;

type Story = StoryObj<typeof Breadcrumbs>;

export const Default: Story = {
    render: (args) => (
        <Stack spacing={2}>
            <Breadcrumbs {...args}>
                <Link href="#" underline="hover" color="inherit">
                    Link 1
                </Link>
                <Link href="#" underline="hover" color="inherit">
                    Link 2
                </Link>
                <Link href="#" underline="hover" color="inherit">
                    Link 3
                </Link>
                <Link href="#" underline="hover" color="inherit">
                    Link 4
                </Link>
                <Link href="#" underline="hover" color="inherit">
                    Link 5
                </Link>
                <Link href="#" underline="hover" color="inherit">
                    Link 6
                </Link>
            </Breadcrumbs>
            <Breadcrumbs maxItems={2}>
                <Link href="#" underline="hover" color="inherit">
                    Link 1
                </Link>
                <Link href="#" underline="hover" color="inherit">
                    Link 2
                </Link>
                <Link href="#" underline="hover" color="inherit">
                    Link 3
                </Link>
            </Breadcrumbs>
            <Breadcrumbs maxItems={2}>
                <Link href="#" underline="hover" color="inherit">
                    <StarIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                    Link 1
                </Link>
                <Link href="#" underline="hover" color="inherit">
                    <StarIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                    Link 2
                </Link>
                <Link href="#" underline="hover" color="inherit">
                    <StarIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                    Link 3
                </Link>
            </Breadcrumbs>
        </Stack>
    ),
};
