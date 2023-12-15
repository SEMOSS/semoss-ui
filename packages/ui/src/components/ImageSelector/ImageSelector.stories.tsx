import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ImageSelector } from "./ImageSelector";

const meta: Meta<typeof ImageSelector> = {
    title: "Components/ImageSelector",
    component: ImageSelector,
};

export default meta;

type Story = StoryObj<typeof ImageSelector>;

const Template = (args) => {
    return (
        <ImageSelector
            value={{
                title: "default",
                src: "https://images.unsplash.com/photo-1522770179533-24471fcdba45",
            }}
            onChange={(value) => console.log("test", value)}
            defaultImageOptions={[
                {
                    title: "Camera",
                    src: "https://images.unsplash.com/photo-1522770179533-24471fcdba45",
                },
                {
                    title: "Coffee",
                    src: "https://images.unsplash.com/photo-1444418776041-9c7e33cc5a9c",
                },
                {
                    title: "Honey",
                    src: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62",
                },
                {
                    title: "Fern",
                    src: "https://images.unsplash.com/photo-1518756131217-31eb79b20e8f",
                },
                {
                    title: "Bike",
                    src: "https://images.unsplash.com/photo-1589118949245-7d38baf380d6",
                },
            ]}
        />
    );
};

export const Default = Template.bind({});

Default.args = {};
