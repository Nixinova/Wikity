const fs = require('fs');
const glob = require('glob');
const formatter = require('html-formatter');
const novasheets = require('novasheets');

import { parse } from './parse';
import { Config, Result } from './types';

const OUT_FOLDER = 'wikity-out/';

export function compile(dir: string = '.', config: Config = {}): void {
    let stylesCreated = false;
    // Write wikitext files
    const files = glob.sync((dir || '.') + "/**/*.wiki", {});
    files.forEach((file: string) => {
        let data: string = fs.readFileSync(file, { encoding: 'utf8' });
        let content: Result = parse(data);
        let outText: string = content.toString();

        let [, folder, filename]: string[] = file.match(/^(.+?[\/\\])((?:templates[\/\\])?[^\/\\]+)$/) as RegExpMatchArray;
        let outFolder: string = (dir || folder || '.') + '/' + OUT_FOLDER;
        let outFilename: string = filename.replace(/ /g, '_').replace('.wiki', '.html');
        let url: string = outFilename.replace(/(?<=^|\/)\w/g, m => m.toUpperCase())
        let displayTitle: string = content.metadata.displayTitle || url.replace('.html', '');

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
        let toc: string = '';
        if (!content.metadata.notoc && (content.metadata.toc || (outText.match(/<h\d[^>]*>/g)?.length || 0) > 3)) {
            let headings = Array.from(content.match(/<h\d[^>]*>.+?<\/h\d>/gs) || []);
            headings.forEach(match => {
                const text: string = match.replace(/\s*<\/?h\d[^>]*>\s*/g, '');
                const lvl: number = +(match.match(/\d/g)?.[0] || -1);
                toc += `${`<ol>`.repeat(lvl - 1)} <li> <a href="#${encodeURI(text.replace(/ /g, '_'))}">${text}</a> </li> ${`</ol>`.repeat(lvl - 1)}`;
            });
            toc = `
                <div id="toc">
                    <span id="toc-heading">
                        <strong>Contents</strong>
                        [<a href="javascript:void(0)" onclick="
                            this.parentNode.parentNode.setAttribute('class', this.innerText === 'hide' ? 'toc-hidden' : '');
                            this.innerText = this.innerText === 'hide' ? 'show' : 'hide';
                        ">hide</a>]
                    </span>
                    <ol>${toc}</ol>
                </div>
            `;
            if (outText.includes('<toc></toc>')) outText = outText.replace('<toc></toc>', toc);
            else outText = outText.replace(/<h\d[^>]*>/, toc + '$&');
        }

        let html = `
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="initial-scale=1.0, width=device-width">
                    <meta name="description" content="${data.substr(0, 256)}">
                    <title>${displayTitle}</title>
                    <link id="default-styles" rel="stylesheet" href="/wiki.css">
                </head>
                <body>
                    <header>
                        <h1 id="page-title">${displayTitle}</h1>
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
        let renderedHtml = formatter.render(html).replace(/(<\/\w+>)(\S)/g, '$1 $2');
        fs.writeFileSync(outFolder + outFilename, frontMatter + renderedHtml, 'utf8');

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

                #toc {display: inline-block; border: 1px solid #aab; padding: 8px; background-color: #f8f8f8; font-size: 95%;}
                &-heading {display: block; text-align: center;}
                & ol {margin: 0 0 0 1.3em;}
                &.toc-hidden {height: 1em;} % ol {display: none;}
            `.replace(/^\s+/gm, ''));
        }
        if (config.customStyles) styles += config.customStyles;
        fs.writeFileSync(outFolder + 'wiki.css.njk', '---\npermalink: /wiki.css\n---\n' + styles);

    });
}
