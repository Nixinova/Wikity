import glob from 'glob';
import fs from 'fs';
import { parse } from './parse';

const OUT_FOLDER = 'wikity-out/';

type Config = {
    eleventy?: boolean,
    defaultStyles?: boolean,
    customStyles?: string,
}

export function compile(dir: string = '.', config: Config = {}) {
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
                `.trim().replace(/^\s+/gm, '');
        }

        // Create HTML
        let html = `
                ${frontMatter}
                <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>${displayTitle}</title>
                        <link rel="stylesheet" href="/wiki.css">
                    </head>
                    <body>
                        <header>
                            <h1>${displayTitle}</h1>
                        </header>
                        <main>\n${outText}
                        </main>
                        <footer>
                            <div id="credit_wikity">Created using <a href="https://github.com/Nixinova/Wikity">Wikity</a></div>
                        </footer>
                    </body>
                </html>
            `.trim().replace(/^\s{1,20}/gm, '');

        // Write to file
        if (!fs.existsSync(outFolder)) {
            fs.mkdirSync(outFolder);
            fs.mkdirSync(outFolder + 'templates/');
        }
        fs.writeFileSync(outFolder + outFilename, html, 'utf8');

        // Create site files
        if (stylesCreated) return;
        stylesCreated = true;
        let styles: string = '';
        if (config.defaultStyles !== false) {
            styles += `
                    body {font-family: sans-serif; margin: 4em; max-width: 1000px; background: #eee;}
                    main {margin: 3em -1em; background: #fff; padding: 1em;}
                    h1, h2 {margin-bottom: 0.6em; font-weight: normal; border-bottom: 1px solid #a2a9b1;}
                    ul, ol {margin: 0.3em 0 0 1.6em; padding: 0;}
                    dt {font-weight: bold;}
                    dd, dl dl {margin-block: 0; margin-inline-start: 30px;}
            
                    a:not(:hover) {text-decoration: none;}
                    a.internal-link {color: #04a;} a.internal-link:visited {color: #26d;}
                    a.external-link {color: #36b;} a.external-link:visited {color: #58d;} a.external-link::after {content: '\\1f855';}
                    a.redlink {color: #d33;} a.redlink:visited {color: #a58;}
                `;
        }
        if (config.customStyles) styles += config.customStyles;
        fs.writeFileSync(outFolder + 'wiki.css.njk', '---\npermalink: /wiki.css\n---\n' + styles);

    });
}
