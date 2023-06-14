module.exports = {
    extends: ['eslint:recommended', 'prettier'],
    env: {
        es6: true,
        browser: true,
    },
    globals: {
        angular: 'readonly',
        require: 'readonly',
        module: 'readonly',
        jvCharts: 'readonly',
        tableau: 'readonly',
    },
    rules: {
        'no-prototype-builtins': 'off',
    },
    parserOptions: {
        sourceType: 'module',
        allowImportExportEverywhere: true,
    },
    overrides: [
        {
            files: ['**/*.ts'],
            rules: {
                'no-prototype-builtins': 'off',
                '@typescript-eslint/no-empty-function': ['warn'],
            },
            plugins: ['@typescript-eslint'],
            extends: [
                'eslint:recommended',
                'plugin:@typescript-eslint/recommended',
                'prettier',
            ],
        },
    ],
};
