module.exports = {
    '{*,libs,packages}/**/*.{ts,tsx,jsx,js,json}': [
        files => `npx eslint ${files}`,
    ],
};

