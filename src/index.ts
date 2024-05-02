import { compile, eleventyCompile } from './compile';
import { rawParse } from './parse';

export = {
    /** Parse wikitext from a string */
    parse: rawParse,
    /** Compile a folder of wikitext files */
    compile: compile,
    /** Compile a folder of wikitext files for output in Eleventy @deprecated */
    eleventyPlugin: eleventyCompile,
};
