import { compile } from './compile';
import { parse } from './parse';

export = {
    compile,
    parse: (data: string): string => parse(data).toString(),
};
