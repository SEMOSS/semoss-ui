module.exports = {
    '*.{ts,tsx,jsx,js,json}': (files) => {
        `echo "Linting files: ${files}"`
    },
};

