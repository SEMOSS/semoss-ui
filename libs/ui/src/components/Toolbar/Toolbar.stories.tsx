import type { Meta, StoryObj } from "@storybook/react-webpack5";
import React from "react";
import { Toolbar } from "./index";

const meta: Meta<typeof Toolbar> = {
	title: "Components/Toolbar",
	component: Toolbar,
	args: {
		children: "This is our Toolbar component",
	},
	argTypes: {},
};

export default meta;

type Story = StoryObj<typeof Toolbar>;

export const Default: Story = {
	render: (args) => <Toolbar {...args} />,
};
