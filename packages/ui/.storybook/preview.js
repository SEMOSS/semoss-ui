/** @type { import('@storybook/react').Preview } */
const preview = {
    parameters: {
        actions: { argTypesRegex: "^on[A-Z].*" },
        controls: {
            expanded: true,
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
    },
};

export default preview;

// .storybook/preview.js
// import { CssBaseline, createTheme } from "@mui/material";
import { withThemeFromJSXProvider } from "@storybook/addon-styling";
import { ThemeProvider, lightTheme, darkTheme } from "../src";

export const decorators = [
    withThemeFromJSXProvider({
        themes: {
            light: lightTheme,
            dark: darkTheme,
        },
        defaultTheme: "light",
        Provider: ({ children, theme }) => {
            return (
                <ThemeProvider theme={theme} reset={true}>
                    {children}
                    {/* Load in Inter Font for Storybook */}
                    <link
                        rel="stylesheet"
                        href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&display=swap"
                    ></link>
                </ThemeProvider>
            );
        },
    }),
];
