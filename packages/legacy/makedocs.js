/**
 * Current documentation is generated using jsdoc. There are no documentation generators that
 * handle both languages. In order to generate documentation, we must first compile the TS to JS,
 * run JSdoc on the compiled files, and then removed compiled files to keep the documents folder clean.
 * When the project is fully switched to TypeScript, we should be using a TypeScript documentation generator.
 * As of now, not including the type in the jsdocs will throw an error and lead to less specific documentation
 **/

const { exec } = require('child_process'),
    fs = require('fs'),
    Path = require('path'),
    compileTs = 'pnpm run tsc -p ./docs',
    buildDocs = 'pnpm run jsdoc -c ./docs/jsdoc.config.json',
    dirsToRemove = [
        'docs/core/',
        'docs/style',
        'docs/widgets',
        'docs/widget-resources',
    ],
    rmDir = (path) => {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach((file) => {
                const curPath = Path.join(path, file);
                if (fs.lstatSync(curPath).isDirectory()) {
                    rmDir(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    };

exec(compileTs, (err, stdout, stderr) => {
    if (!err && !stderr) {
        exec(buildDocs, (err2, stdout2, stderr2) => {
            if (stderr2) {
                const errArr = stderr2.split('ERROR:');
                console.error(errArr);
                console.log(`Found ${errArr.length} error(s)`);
            }
            dirsToRemove.forEach((dir) => {
                rmDir(dir);
            });
        });
    } else {
        console.error('FAILED TO COMPILE TYPESCRIPT. EXITING...');
        console.error(err);
    }
});
