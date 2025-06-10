/** @type {import("eslint").Linter.BaseConfig} */
module.exports = {
    env: {
        browser: true,
        es6: true,
        node: true,
    },
    extends: [
        "../../.eslintrc.json",
        'eslint:recommended',
    ],
    rules: {
        '@typescript-eslint/no-explicit-any': 'error',
    },
};
