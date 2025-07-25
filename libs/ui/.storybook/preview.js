import { withThemeFromJSXProvider } from "@storybook/addon-themes";

import { ThemeProvider, lightTheme, darkTheme } from "../src";

/** @type { import('@storybook/react-webpack5').Preview } */
const preview = {
    parameters: {
        // actions: { argTypesRegex: "^on[A-Z].*" },
        controls: {
            expanded: true,
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
        docs: {
            codePanel: true,
        },
    },
    decorators: [
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
    ],
};

export default preview;
