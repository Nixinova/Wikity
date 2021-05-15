const fs = require('fs');
const glob = require('glob');
const dedent = require('dedent');
const formatter = require('html-formatter');

import { parse } from './parse';
import { Config, Result, RegExpBuilder as re } from './common';

const r = String.raw;

export function eleventyCompile(dir: string = '.', config: Config = {}): void {
    compile(dir, { eleventy: true, ...config });
}

export function compile(dir: string = '.', config: Config = {}): void {
    let stylesCreated = false;
    // Write wikitext files
    const files = glob.sync((dir || '.') + "/**/*.wiki", {});
    files.forEach((file: string) => {
        let data: string = fs.readFileSync(file, { encoding: 'utf8' });
        let content: Result = parse(data, config);
        let outText: string = content.toString();
        const templatesFolder = config.templatesFolder || 'templates';
        const imagesFolder = config.imagesFolder || 'images';

        let [, folder, filename]: string[] = file.match(re(r`^(.+?[\/\\]) ((?:(?:${templatesFolder}|${imagesFolder})[\/\\])?[^\/\\]+)$`, '')) || [];
        let outFolder: string = (dir || folder || '.') + '/' + (config.outputFolder || 'wikity-out') + '/';
        let outFilename: string = filename.replace(/ /g, '_').replace('.wiki', '.html');
        let url: string = outFilename.replace(/(?<=^|\/)\w/g, m => m.toUpperCase())
        let displayTitle: string = content.metadata.displayTitle || url.replace('.html', '');

        // Eleventy configuration
        let frontMatter: string = '';
        if (config.eleventy) {
            frontMatter = dedent`
                ---
                permalink: /wiki/${url}
                ---
            `;
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
            toc = dedent`
                <div id="toc">
                    <span id="toc-heading">
                        <strong>Contents</strong>
                        [<a href="javascript:void(0)" onclick="
                            document.querySelector('#toc ol').setAttribute('style', this.innerText === 'hide' ? 'display: none;' : '');
                            this.innerText = this.innerText === 'hide' ? 'show' : 'hide';
                        ">hide</a>]
                    </span>
                    <ol>${toc}</ol>
                </div>
            `;
            if (outText.includes('<toc></toc>')) outText = outText.replace('<toc></toc>', toc);
            else outText = outText.replace(/<h\d[^>]*>/, toc + '$&');
        }

        let html = dedent`
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
        `;

        // Write to file
        ['', templatesFolder, imagesFolder].forEach((path: string) => {
            if (!fs.existsSync(outFolder + path)) fs.mkdirSync(outFolder + path);
        });
        let renderedHtml = formatter.render(html).replace(/(<\/\w+>)(\S)/g, '$1 $2');
        fs.writeFileSync(outFolder + outFilename, frontMatter + '\n' + renderedHtml, 'utf8');

        // Move images
        glob(imagesFolder + '/*', {}, (err: Error, files: string[]) => {
            if (err) console.warn(err);
            const outImagesFolder = outFolder + imagesFolder + '/';
            if (!fs.existsSync(outImagesFolder)) fs.mkdirSync(outImagesFolder);
            files.forEach((file: string) => fs.copyFileSync(file, outImagesFolder + file.split(/[/\\]/).pop()));
        });

        // Create site styles
        if (!stylesCreated) {
            stylesCreated = true;
            let styles: string = '';
            if (config.defaultStyles !== false) {
                styles = dedent`
                    body {font-family: sans-serif; margin: 4em; max-width: 1000px; background: #eee;}
                    main {margin: 3em -1em; background: #fff; padding: 1em;}
                    h1, h2 {margin-bottom: 0.6em; font-weight: normal; border-bottom: 1px solid #a2a9b1;}
                    ul, ol {margin: 0.3em 0 0 1.6em; padding: 0;}
                    dt {font-weight: bold;}
                    dd, dl dl {margin-block: 0; margin-inline-start: 30px;}

                    figure {margin: 1em;}
                    .image-thumb, .image-frame {padding: 6px; border: 1px solid gray;}
                    figcaption {padding-top: 6px;}

                    table.wikitable {border-collapse: collapse;}
                    table.wikitable, table.wikitable th, table.wikitable td {border: 1px solid gray; padding: 6px;}
                    table.wikitable th {background-color: #eaecf0; text-align: center;}

                    a:not(:hover) {text-decoration: none;}
                    a.internal-link {color: #04a;}
                    a.internal-link:visited {color: #26d;}
                    a.external-link {color: #36b;}
                    a.external-link:visited {color: #58d;}
                    a.external-link::after {content: '\1f855';}
                    a.redlink {color: #d33;}
                    a.redlink:visited {color: #b44;}

                    #toc {display: inline-block; border: 1px solid #aab; padding: 8px; background-color: #f8f8f8; font-size: 95%;}
                    #toc-heading {display: block; text-align: center;}
                    #toc ol {margin: 0 0 0 1.3em;}
                `;
            }
            if (config.customStyles) styles += config.customStyles;
            let cssOutput = dedent`
                ---
                permalink: /wiki.css
                ---
                ${styles}
            `;
            fs.writeFileSync(outFolder + 'wiki.css.njk', cssOutput);
        }

    });
}
