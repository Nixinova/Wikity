import fs from 'fs';

const OUT_FOLDER = 'wikity-out/';

export function clean(): void {
    fs.rmdirSync('_site/' + OUT_FOLDER, { recursive: true });
}
