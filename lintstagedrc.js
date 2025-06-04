module.exports = {
    '{*,libs,packages}/**/*.{ts,tsx,jsx,js}': files => {
        return `nx affected --target=typecheck --files=${files.join(',')}`;
    },
    '{*,libs,packages}/**/*.{ts,tsx,jsx,js,json}': [
        files => `nx affected:lint --files=${files.join(',')}`,
        files => `nx format:write --files=${files.join(',')}`,
    ],
};

