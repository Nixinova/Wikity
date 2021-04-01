import { compile } from './compile';
import { Config } from './common';

export function plugin(folder: string = '.', config: Config = {}): void {
    compile(folder, { ...config, eleventy: true });
}
