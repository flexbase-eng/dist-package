#!/usr/bin/env node

import chalk from 'chalk';
import { program } from 'commander';
import path from 'path';
import { DistPackageOptions } from './dist-package.options';
import fs from 'fs-extra';
import prettier from 'prettier';
import glob from 'glob';

program.version('0.1.0').option('-o, --output <path>', 'The output path').parse(process.argv);

const cliOptions = program.opts();

let packageJSON: Record<string, any>;
const rootPath = path.resolve();
const packagePath = path.join(rootPath, 'package.json');

try {
    packageJSON = JSON.parse(fs.readFileSync(packagePath, { encoding: 'utf8', flag: 'r' }));
} catch (e) {
    console.log(chalk.red(`Error reading package.json at ${packagePath}`));
    process.exit();
}

const options: DistPackageOptions | null = <DistPackageOptions | null>packageJSON["dist-package"];

if (!options) {
    console.log(chalk.red('Error finding "dist-package" settings in package JSON'));
    process.exit();
}

const outputPath = cliOptions.output || options.output;

if (!outputPath || outputPath.trim().length === 0) {
    console.log(chalk.red('Missing output path'));
    process.exit();
}

try {
    fs.mkdirSync(outputPath, { recursive: true })
} catch (e) {
    console.log(chalk.red('Unable to create output path'));
    process.exit();
}

if (options.revisionIncrement && packageJSON.version) {
    let version: string = packageJSON.version;

    let [major, minor, revision] = version.split('.').map(x => Number(x));

    ++revision;

    packageJSON.version = `${major}.${minor}.${revision}`;

    fs.writeFileSync(packagePath, prettier.format(JSON.stringify(packageJSON), { parser: 'json' }));
}

if (options.properties) {
    const clonedProperties: Record<string, any> = {};
    const entries = Object.entries(packageJSON);

    options.properties.forEach(x => {
        const found = entries.find(y => y[0] === x);
        if (found) {
            return (clonedProperties[found[0]] = found[1]);
        }
    });

    try {
        fs.writeFileSync(path.join(outputPath, 'package.json'), prettier.format(JSON.stringify(clonedProperties), { parser: 'json' }));
    } catch (e) {
        console.log(chalk.red(`Error writing package.json at ${packagePath}`));
        process.exit();
    }
}
 
if (options.include) {
    options.include.forEach(x =>
        glob(x, (error, files) => {

            if (error) {
                console.error(chalk.red(`Error copying: ${error}`));
                process.exit();
            }

            files.forEach(file => fs.copy(file, path.join(outputPath, file), { overwrite: true }, err => {
                if (err) {
                    console.error(chalk.red(`Error copying: ${err}`));
                }
            }));
        }));
}