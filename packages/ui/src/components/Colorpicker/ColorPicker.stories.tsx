import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ColorPicker } from "../Colorpicker/index";

const meta: Meta<typeof ColorPicker> = {
    title: "Components/ColorPicker",
    component: ColorPicker,
};

export default meta;

type Story = StoryObj<typeof ColorPicker>;

const Example = () => {
    const [color, setColor] = useState(null);
    console.log(color);
    return (
        <>
            <ColorPicker
                onChange={(val) => setColor(val)}
                defaultValue="transparent"
                value={color}
                hideTextfield={true}
                openAtStart={true}
            />
            <div>Your color is: #{color ? color.hex : ""}</div>
        </>
    );
};

export const Default: Story = {
    render: () => <Example />,
};
