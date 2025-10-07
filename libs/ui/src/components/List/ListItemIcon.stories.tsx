import { StartRounded } from "@mui/icons-material";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import React from "react";
// Do we want to export directly from index
import { ListItemIcon } from "./ListItemIcon";

const meta: Meta<typeof ListItemIcon> = {
	title: "Components/List/ListItemIcon",
	component: ListItemIcon,
	args: {
		sx: {},
	},
};

export default meta;

type Story = StoryObj<typeof ListItemIcon>;

export const Default: Story = {
	render: (args) => (
		<ListItemIcon {...args}>
			<StartRounded />
		</ListItemIcon>
	),
};
