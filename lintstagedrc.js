module.exports = {
    '{apps,libs,tools}/**/*.{ts,tsx,jsx,js}': files => {
        return `nx affected --target=typecheck --files=${files.join(',')}`;
    },
    '{apps,libs,tools}/**/*.{ts,tsx,jsx,js,json}': [
        files => `nx affected:lint --files=${files.join(',')}`,
        files => `nx format:write --files=${files.join(',')}`,
    ],
};

