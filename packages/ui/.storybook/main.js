/** @type { import('@storybook/react-webpack5').StorybookConfig } */
const config = {
    stories: ["../src/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
    addons: [
        "@storybook/addon-links",
        "@storybook/addon-essentials",
        "@storybook/addon-interactions",
        "@storybook/addon-styling",
    ],
    framework: {
        name: "@storybook/react-webpack5",
        options: {},
    },
    docs: {
        autodocs: "tag",
    },
    typescript: {
        check: true,
        reactDocgen: "react-docgen-typescript",
        reactDocgenTypescriptOptions: {
            shouldExtractLiteralValuesFromEnum: true,
            propFilter: (prop) =>
                prop.parent
                    ? /@mui/.test(prop.parent.fileName) ||
                      !/node_modules/.test(prop.parent.fileName)
                    : true,
            compilerOptions: {
                allowSyntheticDefaultImports: false,
            },
        },
    },
};
export default config;
