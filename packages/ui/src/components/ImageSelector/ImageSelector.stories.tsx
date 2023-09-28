import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ImageSelector } from "./ImageSelector";

const meta: Meta<typeof ImageSelector> = {
    title: "Components/ImageSelector",
    component: ImageSelector,
};

export default meta;

type Story = StoryObj<typeof ImageSelector>;
//change options these links wont work

export const Default: Story = {
    render: () => (
        <ImageSelector
            value={"https://images.unsplash.com/photo-1551782450-a2132b4ba21d"}
            onChange={() => console.log("test")}
            options={[
                {
                    title: "Default",
                    src: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d",
                },
                {
                    title: "Blue Default",
                    src: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d",
                },
                {
                    title: "Orange Default",
                    src: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d",
                },
                {
                    title: "Purple Default",
                    src: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d",
                },
                {
                    title: "Red Default",
                    src: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d",
                },
            ]}
        />
    ),
};
