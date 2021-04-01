#!/usr/bin/env node

import wikity from './index';

const VERSION = '1.2.0';

const indent = (n: number): string => ' '.repeat(n * 4);
const usage = (command: string, ...desc: string[]): void => {
    console.log('\n' + indent(2) + command);
    desc.forEach((msg: string) => console.log(indent(2.5) + msg));
}
const arg = (n: number): string => process.argv[n + 1] || '';
const args = process.argv.slice(1);

if (!arg(1)) {
    console.log('Type `wikity help` for a list of commands.');
}
else if (arg(1).includes('h')) {
    console.log(`\n${indent(1)}Wikity CLI commands:`);
    usage(`wikity (help|-h)`,
        `Display this help message.`,
    );
    usage(`wikity (compile|-c) [<folder>] [-o <folder>] [-t <folder>] [-e] [-d]`,
        `Compile wikitext files from a given folder.`,
        `  [<folder>]\n${indent(3.5)}Input folder ('.' (current folder) if unset).`,
        `  (-o|--outputFolder) <folder>\n${indent(3.5)}Folder that compiled HTML files are placed in ('wikity-out' if unset).`,
        `  (-t|--templatesFolder) <folder>\n${indent(3.5)}Where to place wiki templates ('templates' if unset).`,
        `  (-e|--eleventy)\n${indent(3.5)}Compiles files with Eleventy front matter (false if unset).`,
        `  (-d|--defaultStyles)\n${indent(3.5)}Add default wiki styling to all pages (true if unset).`,
    )
    usage(`wikity (parse|-p) "<input>"`,
        `Parse raw wikitext from the command line.`,
    )
    usage(`wikity (version|-v)`,
        `Display the current version of Wikity.`,
    );
}
else if (arg(1).includes('c')) {
    const configArgs = args.slice(2);
    const folder = arg(2) || '.';
    const outputFolder = configArgs.join(' ').includes('-o') && configArgs.filter((_, i) => configArgs[i - 1]?.includes('-o')).join(' ') || '';
    const templatesFolder = configArgs.join(' ').includes('-t') && configArgs.filter((_, i) => configArgs[i - 1]?.includes('-t')).join(' ') || '';
    const eleventy = configArgs.join(' ').includes('-e');
    const defaultStyles = configArgs.join(' ').includes('-d');
    wikity.compile(folder, { outputFolder, templatesFolder, eleventy, defaultStyles });
}
else if (arg(1).includes('p')) {
    const input = arg(2);
    console.log(wikity.parse(input));
}
else if (arg(1).includes('v')) {
    console.log('The current version of Wikity is ' + VERSION);
}
else {
    console.log('Unknown command; type `wikity help` for help');
}
