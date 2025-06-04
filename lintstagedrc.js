const { execSync } = require('child_process');

module.exports = {
    '{apps,libs,tools}/**/*.{ts,tsx,jsx,js}': files => {
        return `nx affected --target=typecheck --files=${files.join(',')}`;
    },
    '{apps,libs,tools}/**/*.{ts,tsx,jsx,js,json}': [
        files => `nx affected:lint --files=${files.join(',')}`,
        files => `nx format:write --files=${files.join(',')}`,
    ],
};

// module.exports = async ( stagedFiles ) => {
//     //files to lint
//     const tsFiles = stagedFiles.filter((f) => 
//         /\.(ts|tsx|js|jsx)$/.test(f)
//     );

//     console.log("ts files")

//     const prettierCmds = stagedFiles.map((file) => `prettier --write ${file}`);

//     if(tsFiles.length === 0) return prettierCmds;

//     //get the all of the nx projects
//     const graphRaw = execSync('npx nx show projects --json').toString();
//     const projectGraph = JSON.parse(graphRaw);

//     //affected projects
//     const affectedRaw = execSync(`npx nx print-affected --type=lint --files=${tsFiles.join(',')}`);
//     const affected = JSON.parse(affectedRaw);
//     const affectedProjects = affected.projects ?? [];

//     //only return projects with a lint target
//     const lintableProjects = affectedProjects.filter((p) => {
//         const targets = projectGraph[p]?.targets ?? {};
//         return targets.hasOwnProperty('lint');
//     });

//     const lintCmds = lintableProjects.map((project) => `npx nx lint ${project}`);

//     return [...lintCmds, ...prettierCmds];
// };
