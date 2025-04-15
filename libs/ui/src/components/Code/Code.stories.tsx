import React from "react";
import { Code } from ".";

export default {
    title: "Components/Code",
    component: Code,
};

const Template = (args) => {
    return <Code {...args} />;
};

export const Default = Template.bind({});

Default.args = {
    code: `
    const name = "world";

    function log(name){
        console.log(name)
    }

    log(name)
    `,
    language: "javascript",
};

// export const Inline = Template.bind({});

// Inline.args = {
//     code: `1+1`,
//     inline: true,
// };

// export const Highlight = Template.bind({});

// Highlight.args = {
//     code: `1+1`,
//     language: "javascript",
//     inline: true,
// };

// export const Highlight2 = Template.bind({});

// Highlight2.args = {
//     language: "javascript",
//     inline: false,
// };
