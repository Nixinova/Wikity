const fs = require('fs');
const glob = require('glob');
const dedent = require('dedent');
const formatter = require('html-formatter');

import { parse } from './parse';
import { Config, Result, RegExpBuilder as re } from './common';
import defaultStyles from './wiki.css';

const r = String.raw;

export function eleventyCompile(dir: string = '.', config: Config = {}): void {
    compile(dir, { eleventy: true, ...config });
}

export function compile(dir: string = '.', config: Config = {}): void {
    let stylesCreated = false;
    // Write wikitext files
    const files = glob.sync(dir + "/**/*.wiki", {});
    files.forEach((file: string) => {
        const fileData: string = fs.readFileSync(file, { encoding: 'utf8' });
        const { data: parsedContent, metadata }: Result = parse(fileData, config);

        let outText: string = parsedContent;

        const templatesFolder = config.templatesFolder || 'templates';
        const imagesFolder = config.imagesFolder || 'images';
        const outputFolder = config.outputFolder || 'wikity-out';

        const [, folder, filename]: string[] = file.match(re(r`^(.+?[\/\\]) ((?:(?:${templatesFolder}|${imagesFolder})[\/\\])?[^\/\\]+)$`, '')) || [];
        const outFolder: string = dir + '/' + outputFolder + '/';
        const outFilename: string = filename.replace(/ /g, '_').replace('.wiki', '.html');
        const urlPath: string = outFilename.replace(/(?<=^|\/)\w/g, m => m.toUpperCase())
        const displayTitle: string = metadata.displayTitle || urlPath.replace('.html', '');

        // Eleventy configuration
        const frontMatter = config.eleventy ? dedent`
                ---
                permalink: /wiki/${urlPath}
                ---
            ` : '';

        // Create TOC
        if (!metadata.notoc && (metadata.toc || (outText.match(/<h\d[^>]*>/g)?.length || 0) > 3)) {
            let toc = '';
            let headings = Array.from(parsedContent.match(/<h\d[^>]*>.+?<\/h\d>/gs) || []);
            headings.forEach(match => {
                const text: string = match.replace(/\s*<\/?h\d[^>]*>\s*/g, '');
                const lvl: number = +(match.match(/\d/g)?.[0] || -1);
                toc += `${`<ol>`.repeat(lvl - 1)} <li> <a href="#${encodeURI(text.replace(/ /g, '_'))}">${text}</a> </li> ${`</ol>`.repeat(lvl - 1)}`;
            });
            const tocElem = dedent`
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
            // Set TOC on page
            if (outText.includes('<toc></toc>')) outText = outText.replace('<toc></toc>', tocElem);
            else outText = outText.replace(/<h\d[^>]*>/, tocElem + '$&');
        }

        // Create plaintext of HTML for use as description/metadata property.
        const plaintextData = parsedContent.replace(/<.+?>/gs, ' ');

        // Create HTML
        const html = dedent`
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="initial-scale=1.0, width=device-width">
                    <meta name="description" content="${plaintextData.substring(0, 256)}...">
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
        for (const path of ['', templatesFolder, imagesFolder]) {
            if (!fs.existsSync(outFolder + path)) {
                fs.mkdirSync(outFolder + path);
            }
        };
        const renderedHtml = formatter.render(html).replace(/(<\/\w+>)(\S)/g, '$1 $2');
        fs.writeFileSync(outFolder + outFilename, frontMatter + '\n' + renderedHtml, 'utf8');

        // Move images
        glob(imagesFolder + '/*', {}, (err: Error, files: string[]) => {
            if (err) {
                console.warn(err);
            }

            const outImagesFolder = outFolder + imagesFolder + '/';
            if (!fs.existsSync(outImagesFolder)) {
                fs.mkdirSync(outImagesFolder);
            }

            for (const file of files) {
                fs.copyFileSync(file, outImagesFolder + file.split(/[/\\]/).pop())
            };
        });

        // Create site styles
        if (!stylesCreated) {
            stylesCreated = true;
            let styles: string = '';
            if (config.defaultStyles !== false) {
                styles += defaultStyles;
            }
            if (config.customStyles) {
                styles += config.customStyles;
            }
            const cssOutput = dedent`
                ---
                permalink: /wiki.css
                ---
                ${styles}
            `;
            fs.writeFileSync(outFolder + 'wiki.css.njk', cssOutput);
        }

    });
}
