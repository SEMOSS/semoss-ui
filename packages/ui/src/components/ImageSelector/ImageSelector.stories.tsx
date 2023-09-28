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

const Template = (args) => {
    return (
        <ImageSelector
            value={"https://images.unsplash.com/photo-1551782450-a2132b4ba21d"}
            onChange={(value) => console.log("test", value)}
            options={[
                {
                    title: "Default",
                    src: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d",
                },
                {
                    title: "Blue Default",
                    src: "https://www.google.com/url?sa=i&url=https%3A%2F%2Fcognitiveseo.com%2Fblog%2F23628%2Furl-structure%2F&psig=AOvVaw1DdLr4AjSzrzQ4O54R8JtV&ust=1696019049679000&source=images&cd=vfe&opi=89978449&ved=0CBAQjRxqFwoTCMDR17mRzoEDFQAAAAAdAAAAABAJ",
                },
                {
                    title: "Orange Default",
                    src: "https://www.google.com/imgres?imgurl=https%3A%2F%2Fwww.searchenginejournal.com%2Fwp-content%2Fuploads%2F2018%2F04%2Fdurable-urls.png&tbnid=AVCxVoSNwFz11M&vet=12ahUKEwiAzZa5kc6BAxWMPUQIHVRHDd8QMygEegQIARB1..i&imgrefurl=https%3A%2F%2Fwww.searchenginejournal.com%2Fdurable-urls-seo%2F244281%2F&docid=uYSuFfnWCk3lCM&w=1600&h=840&q=image%20urls&safe=active&ved=2ahUKEwiAzZa5kc6BAxWMPUQIHVRHDd8QMygEegQIARB1",
                },
                {
                    title: "Purple Default",
                    src: "https://www.google.com/imgres?imgurl=https%3A%2F%2Fcdn.pixabay.com%2Fphoto%2F2015%2F03%2F10%2F17%2F23%2Fyoutube-667451_1280.png&tbnid=SD7-6vyOeygwcM&vet=12ahUKEwiAzZa5kc6BAxWMPUQIHVRHDd8QMygIegQIARB9..i&imgrefurl=https%3A%2F%2Fpixabay.com%2Fimages%2Fsearch%2Furl%2F&docid=OVVUTETZ1D78_M&w=1280&h=640&q=image%20urls&safe=active&ved=2ahUKEwiAzZa5kc6BAxWMPUQIHVRHDd8QMygIegQIARB9",
                },
                {
                    title: "Red Default",
                    src: "https://www.google.com/imgres?imgurl=https%3A%2F%2Fstatic.javatpoint.com%2Fcomputer%2Fimages%2Fwhat-is-the-url.png&tbnid=IflUsLqSUHqeoM&vet=12ahUKEwiAzZa5kc6BAxWMPUQIHVRHDd8QMygHegQIARB7..i&imgrefurl=https%3A%2F%2Fwww.javatpoint.com%2Furl&docid=VpLxBE_M8GoZMM&w=1300&h=600&q=image%20urls&safe=active&ved=2ahUKEwiAzZa5kc6BAxWMPUQIHVRHDd8QMygHegQIARB7",
                },
            ]}
        />
    );
};

export const Default = Template.bind({});

Default.args = {};
