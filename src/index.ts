#!/usr/bin/env node

import chalk from 'chalk';
import { program } from 'commander';
import path from 'path';
import { DistPackageOptions } from './dist-package.options';
import * as fs from 'fs';
import prettier from 'prettier';

program.version('0.1.0').option('-o, --output <path>', 'The output file path').parse(process.argv);

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

const entries = Object.entries(packageJSON);

const options: DistPackageOptions | null = <DistPackageOptions | null>entries.find(([key, _]) => key === 'dist-package')?.[1];

if (!options) {
    console.log(chalk.red('Error finding "dist-package" settings in package JSON'));
    process.exit();
}

const outputPath = cliOptions.output || options.output;

if (!outputPath || outputPath.trim().length === 0) {
    console.log(chalk.red('Missing output path'));
    process.exit();
}

const clonedProperties: Record<string, any> = {};

options.properties.forEach(x => {
    const found = entries.find(y => y[0] === x);
    if (found) {
        return (clonedProperties[found[0]] = found[1]);
    }
});

try {
    fs.writeFileSync(outputPath, prettier.format(JSON.stringify(clonedProperties), {parser: 'json'}));
} catch (e) {
    console.log(chalk.red(`Error writing package.json at ${packagePath}`));
    process.exit();
}
 