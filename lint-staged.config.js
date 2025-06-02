module.exports = {
    '{client,ui}/**/*.{ts,tsx,jsx,js}': files => {
        return `nx affected --target=typecheck --files=${files.join(',')}`;
    },
    '{client,ui}/**/*.{js,ts,jsx,tsx,json}': [
        files => `nx affected:lint --files=${files.join(',')}`,
        files => `nx format:write --files=${files.join(',')}`,
    ],
};
