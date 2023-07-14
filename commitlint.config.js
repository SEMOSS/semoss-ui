module.exports = {
    extends: [
        "@commitlint/config-conventional"
    ],
    ignores: [
        (message) => message.includes('merge') || message.includes('merged')
    ]
}