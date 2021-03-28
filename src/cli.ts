#!/usr/bin/env node

import wikity from './index';

const VERSION = '1.1.0';

const indent = (n: number): string => ' '.repeat(n * 4);
const usage = (command: string, ...desc: string[]): void => {
    console.log('\n' + indent(2) + command);
    for (let msg of desc) console.log(indent(3) + msg);
}
const arg = (n: number): string => process.argv[n + 1] || '';


if (!arg(1)) {
    console.log('Type `wikity help` for a list of commands.');
}
else if (arg(1).includes('h')) {
    console.log(`\n${indent(1)}Wikity CLI commands:`);
    usage(`wikity [--]h[elp]`,
        `Display this help message.`,
    );
    usage(`wikity [--]c[ompile] [<folder>]`,
        `Compile wikitext files from a given folder.`,
    )
    usage(`wikity [--]p[arse] "<input>"`,
        `Parse raw wikitext from the command line.`,
    )
    usage(`wikity [--]v[ersion]`,
        `Display the current version of Wikity.`,
    );
}
else if (arg(1).includes('c')) {
    wikity.compile(arg(2) || '.', { eleventy: !!arg(3) });
}
else if (arg(1).includes('p')) {
    console.log(wikity.parse(arg(2)));
}
else if (arg(1).includes('v')) {
    console.log('The current version of Wikity is ' + VERSION);
}
else {
    console.log('Unknown command; type `wikity help` for help');
}
