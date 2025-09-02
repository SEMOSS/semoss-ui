import { dirname, join } from "path";

/** @type { import('@storybook/react-webpack5').StorybookConfig } */

const config = {
	stories: ["../src/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
	addons: [
		getAbsolutePath("@storybook/addon-links"),
		getAbsolutePath("@storybook/addon-themes"),
		getAbsolutePath("@storybook/addon-webpack5-compiler-swc"),
		getAbsolutePath("@storybook/addon-docs"),
	],
	framework: {
		name: getAbsolutePath("@storybook/react-webpack5"),
		options: {},
	},
	docs: {},
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
module.exports = config;

function getAbsolutePath(value) {
	return dirname(require.resolve(join(value, "package.json")));
}
