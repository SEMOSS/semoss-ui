import type { Meta, StoryObj } from "@storybook/react";
import { FileUpload } from "../FileUpload/index";

const meta: Meta<typeof FileUpload> = {
    title: "Components/FileUpload",
    component: FileUpload,
};

export default meta;

type Story = StoryObj<typeof FileUpload>;

export const Default: Story = {
    render: () => <FileUpload />,
};
