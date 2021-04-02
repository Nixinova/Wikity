import { compile, eleventyCompile } from './compile';
import { rawParse } from './parse';

export = {
    parse: rawParse,
    compile: compile,
    eleventyPlugin: eleventyCompile, // deprecated
};
