import { compile } from './compile';
import { parse } from './parse';
import { plugin } from './eleventy';

export = {
    compile,
    parse: (data: string): string => parse(data).toString(),
    eleventyPlugin: plugin,
};
