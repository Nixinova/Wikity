const fs = require('fs');
const glob = require('glob');
const formatter = require('html-formatter');
const novasheets = require('novasheets');

import { parse } from './parse';

const OUT_FOLDER = 'wikity-out/';

type Config = {
    eleventy?: boolean,
    defaultStyles?: boolean,
    customStyles?: string,
}

export function compile(dir: string = '.', config: Config = {}): void {
    let stylesCreated = false;
    // Write wikitext files
    const files = glob.sync((dir || '.') + "/**/*.wiki", {});
    files.forEach((file: string) => {
        let data: string = fs.readFileSync(file, { encoding: 'utf8' });

        let [, folder, filename]: string[] = file.match(/^(.+?[\/\\])((?:templates[\/\\])?[^\/\\]+)$/) as RegExpMatchArray;
        let outFolder: string = (dir || folder || '.') + '/' + OUT_FOLDER;
        let outFilename: string = filename.replace(/ /g, '_').replace('.wiki', '.html');
        let url: string = outFilename.replace(/(?<=^|\/)\w/g, m => m.toUpperCase())
        let displayTitle: string = url.replace('.html', '');

        let outText = parse(data);

        // Eleventy configuration
        let frontMatter: string = '';
        if (config.eleventy) {
            frontMatter = `
                ---
                permalink: /wiki/${url}
                ---
            `.trimStart().replace(/^\s+/gm, '');
        }

        // Create HTML
        let html = `
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="initial-scale=1.0, width=device-width">
                    <meta name="description" content="${data.substr(0, 256)}">
                    <title>${displayTitle}</title>
                    <link rel="stylesheet" href="/wiki.css">
                </head>
                <body>
                    <header>
                        <h1>${displayTitle}</h1>
                    </header>
                    <main>
                        <p>\n${outText}
                        </p>
                    </main>
                    <footer>
                        <p id="credit_wikity">Created using <a href="https://github.com/Nixinova/Wikity">Wikity</a></p>
                    </footer>
                </body>
            </html>
        `.trim().replace(/^\s{1,20}/gm, '');

        // Write to file
        if (!fs.existsSync(outFolder)) {
            fs.mkdirSync(outFolder);
            fs.mkdirSync(outFolder + 'templates/');
        }
        fs.writeFileSync(outFolder + outFilename, frontMatter + formatter.render(html), 'utf8');

        // Create site files
        if (stylesCreated) return;
        stylesCreated = true;
        let styles: string = '';
        if (config.defaultStyles !== false) {
            styles += novasheets.parse(`
                body {font-family: sans-serif; margin: 4em; max-width: 1000px; background: #eee;}
                main {margin: 3em -1em; background: #fff; padding: 1em;}
                h1, h2 {margin-bottom: 0.6em; font-weight: normal; border-bottom: 1px solid #a2a9b1;}
                ul, ol {margin: 0.3em 0 0 1.6em; padding: 0;}
                dt {font-weight: bold;}
                dd, dl dl {margin-block: 0; margin-inline-start: 30px;}

                a:not(:hover) {text-decoration: none;}
                a.internal-link {color: #04a;} &:visited {color: #26d;}
                a.external-link {color: #36b;} &:visited {color: #58d;} &::after {content: '\\1f855';}
                a.redlink {color: #d33;} &:visited {color: #b44;}
            `.replace(/^\s+/gm, ''));
        }
        if (config.customStyles) styles += config.customStyles;
        fs.writeFileSync(outFolder + 'wiki.css.njk', '---\npermalink: /wiki.css\n---\n' + styles);

    });
}
