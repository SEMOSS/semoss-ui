module.exports = {
    extends: ['@commitlint/config-conventional'],
    //commit format should follow: 'type(scope): subject'
    rules: {
        // Type Rules
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
        'type-case': [2, 'always', ['lower-case']],
        'type-empty': [2, 'never'],

        // Scope Rules
        'scope-enum': [
            2,
            'always',
            ['cli', 'client', 'legacy', 'renderer', 'sdk', 'ui', 'environment'],
        ],
        'scope-case': [2, 'always', ['lower-case']],
        'scope-empty': [2, 'never'],

        // Subject rules
        'subject-case': [2, 'always', ['lower-case']],
        'subject-empty': [2, 'never'],
    },
    ignores: [
        (message) => message.includes('merge') || message.includes('merged'),
    ],
};
