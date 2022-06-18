#!/usr/bin/env node

import chalk from 'chalk';
import { InvalidArgumentError, program } from 'commander';
import path from 'path';
import { PackrOptions } from './packr.options';
import fs from 'fs-extra';
import prettier from 'prettier';
import glob from 'glob';

const integerParser = (value: any, _: any) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) {
        throw new InvalidArgumentError('Must be an integer');
    }
    return num;
}

program.version('0.1.0')
    .option('-o, --output <path>', 'The output path')
    .option('--major <number>', 'The major version number for this package', integerParser)
    .option('--minor <number>', 'The minor version number for this package', integerParser)
    .option('--revision <number>', 'The revision number for this package', integerParser)
    .parse(process.argv);

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

const options: PackrOptions | null = packageJSON.packr;

if (!options) {
    console.log(chalk.red('Error finding "packr" settings in package.json'));
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

const cliMajor = cliOptions.major;
const cliMinor = cliOptions.minor;
const cliRevision = cliOptions.revision;

const hasVersion = cliMajor !== undefined || cliMinor !== undefined || cliRevision !== undefined;

if (hasVersion && packageJSON.version) {
    const version: string = packageJSON.version;

    const [major, minor, revision] = version.split('.').map(x => Number(x));

    packageJSON.version = `${cliMajor || major}.${cliMinor || minor}.${cliRevision || revision}`;

    //fs.writeFileSync(packagePath, prettier.format(JSON.stringify(packageJSON), { parser: 'json' }));
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
        console.log(chalk.red(`Error writing package.json at ${outputPath}`));
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