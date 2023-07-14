// Reference: https://robertcooper.me/post/using-eslint-and-prettier-in-a-typescript-project
module.exports = {
    env: {
        jest: true,
    },
    settings: {
        react: {
            version: "detect",
        },
    },
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: {
            jsx: true,
        },
    },
    extends: [
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier",
        "plugin:prettier/recommended",
    ],
    rules: {
        "react/prop-types": "off",
        "react/jsx-uses-react": "off",
        "react/react-in-jsx-scope": "off",
        "prettier/prettier": ["error", { endOfLine: "auto" }],
        "@typescript-eslint/no-explicit-any": "error",
    },
    overrides: [
        {
            files: ["**/*.stories.*"],
            rules: {
                "import/no-anonymous-default-export": "off",
            },
        },
    ],
    ignorePatterns: ["dist"],
};
