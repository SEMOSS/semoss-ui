module.exports = {
    '{*,libs,packages}/**/*.{ts,tsx,jsx,js,json}': [
        files => `nx affected --target=eslint:lint --files=${files.join(',')}`,
        console.log('Staged files: ', files)
        // files => `nx format:write --files=${files.join(',')}`,
    ],
};

