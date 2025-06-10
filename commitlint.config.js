module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [
            2,
            'always',
            [
                'build',
                'ci',
                'docs',
                'feat',
                'fix',
                'perf',
                'refactor',
                'style',
                'test',
            ],
        ],
        'scope-enum': [
            2,
            'always',
            ['client', 'legacy', 'playsheet', 'sdk', 'ui', 'environment'],
        ],
        'scope-empty': [2, 'never'],
    },
    ignores: [
        (message) => message.includes('merge') || message.includes('merged'),
    ],
};
