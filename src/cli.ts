const VERSION = require('../package.json').version;

import wikity from './index';

// Helper functions
const indent = (n: number): string => ' '.repeat(n * 4);
const usage = (command: string, ...desc: string[]): void => {
    console.log('\n' + indent(2) + command);
    desc.forEach((msg: string) => console.log(indent(2.5) + msg));
}
const arg = (n: number): string => process.argv[n + 1] || '';
const args = process.argv.slice(1);

// Run CLI
if (!arg(1)) {
    // No arguments

    console.log('Type `wikity help` for a list of commands.');
}
else if (arg(1).includes('h')) {
    // Show help message

    console.log(`\n${indent(1)}Wikity CLI commands:`);
    usage(`wikity (help|-h)`,
        `Display this help message.`,
    );
    usage(`wikity compile [<folder>] [-o <folder>] [-t <folder>] -i <folder>] [-e] [-d]`,
        `Compile wikitext files from a given folder.`,
        `  [<folder>]\n${indent(3.5)}Input folder ('.' (current folder) if unset).`,
        `  (-o|--outputFolder) <folder>\n${indent(3.5)}Folder that compiled HTML files are placed in ('wikity-out' if unset).`,
        `  (-t|--templatesFolder) <folder>\n${indent(3.5)}Where to place wiki templates ('templates' if unset).`,
        `  (-i|--imagesFolder) <folder>\n${indent(3.5)}Where to place wiki images ('images' if unset).`,
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
    // Run compilation

    const configArgs: string[] = args.slice(2);
    const argsList: string = configArgs.join(' ');

    // retrieve item from arguments list
    const getArgContent = (arg: RegExp) => arg.test(argsList) && configArgs.filter((_, i) => arg.test(configArgs[i - 1])).join(' ') || undefined;

    // Fetch user-supplied arguments
    const folder = arg(2) || '.';
    const outputFolder = getArgContent(/^-+o/);
    const templatesFolder = getArgContent(/^-+t/);
    const imagesFolder = getArgContent(/^-+i/);
    const eleventy = /^-+e/.test(argsList);
    const defaultStyles = /^-+d/.test(argsList);

    wikity.compile(folder, { outputFolder, templatesFolder, imagesFolder, eleventy, defaultStyles });
}
else if (arg(1).includes('p')) {
    // Run parsing

    // second argument is inputted text
    const input = arg(2);

    const output = wikity.parse(input);
    console.log(output);
}
else if (arg(1).includes('v')) {
    // Show version

    console.log('The current version of Wikity is ' + VERSION);
}
else {
    // Unknown command

    console.log('Unknown command; type `wikity help` for help');
}
