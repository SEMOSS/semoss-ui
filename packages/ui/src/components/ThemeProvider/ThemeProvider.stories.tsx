import type { Meta, StoryObj } from "@storybook/react";

import { ThemeOptions } from "../../theme";
import { Button } from "../Button";
import { ThemeProvider } from "./ThemeProvider";

const meta: Meta<typeof ThemeProvider> = {
    title: "Components/ThemeProvider",
    component: ThemeProvider,
};

export default meta;

type Story = StoryObj<typeof ThemeProvider>;

const customTheme: ThemeOptions = {
    palette: {
        mode: "light",
        primary: {
            main: "#00FF00",
            light: "#8fc7ff",
            dark: "#263ea7",
        },
    },
};

const Example = () => {
    return (
        <>
            <Button variant="contained">Hello</Button>
            <ThemeProvider theme={customTheme}>
                <Button variant={"contained"}>Themed Hello</Button>
            </ThemeProvider>
            <div>
                In order to change the theme, you have to leverage createTheme
            </div>
        </>
    );
};

export const Default: Story = {
    render: () => <Example />,
};
