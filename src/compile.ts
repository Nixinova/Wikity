import fs from 'fs';
import paths from 'path';
import glob from 'glob';
import dedent from 'dedent';

import { parse } from './parse';
import { Config, Result } from './common';
import defaultStyles from './wiki.css';

export function eleventyCompile(dir: string = '.', config: Config = {}): void {
    compile(dir, { eleventy: true, ...config });
}

export function compile(dir: string = '.', config: Config = {}): void {
    // set defaults
    config.templatesFolder ??= 'templates';
    config.imagesFolder ??= 'images';
    config.outputFolder ??= 'wikity-out';

    // directory variables (absolute paths)
    const baseDir = paths.resolve(dir);
    const templatesFolder = paths.join(baseDir, config.templatesFolder);
    const imagesFolder = paths.join(baseDir, config.imagesFolder);
    const outputFolder = paths.join(baseDir, config.outputFolder);
    const outputImagesFolder = paths.join(baseDir, config.outputFolder, config.imagesFolder);
    const newConfig = { ...config, templatesFolder, imagesFolder, outputFolder };

    let stylesCreated = false;
    // Write wikitext files
    const files = glob.sync(dir + "/**/*.wiki", {});
    files.forEach((file: string) => {
        const fileData: string = fs.readFileSync(file, { encoding: 'utf8' });
        const { data: parsedContent, metadata }: Result = parse(fileData, newConfig);

        let outText: string = parsedContent;

        const filename = file.replace(dir, '').replace(/^[\/\\]/, '');
        const outFilename: string = filename.replace(/ /g, '_').replace('.wiki', '.html');
        const outFilePath = paths.join(outputFolder, outFilename);
        const urlPath: string = outFilename.replace(/(?<=^|\/)\w/g, m => m.toUpperCase()); // capitalise first letters

        const displayTitle: string = metadata.displayTitle || urlPath.replace('.html', '').replace(/_/g, ' ');

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
                const headingInner: string = match.replace(/\s*<\/?h\d[^>]*>\s*/g, '');
                const text = headingInner.replace(/<.+?>/g, ''); // remove tags from inner
                const lvl: number = +(match.match(/\d/g)?.[0] || -1);
                toc += `${`<ol>`.repeat(lvl - 1)} <li> <a href="#${encodeURI(text.replace(/ /g, '_'))}">${text}</a> </li> ${`</ol>`.repeat(lvl - 1)}`;
            });
            toc = toc.replace(/<\/ol>\s*<ol>/g, '');
            const tocElem = dedent`
                <div id="page+toc">
                    <span id="page+toc+heading">
                        <strong>Contents</strong>
                        [<a href="javascript:void(0)" onclick="
                            document.getElementById('page+toc+contents').setAttribute('style', this.innerText === 'hide' ? 'display: none;' : '');
                            this.innerText = this.innerText === 'hide' ? 'show' : 'hide';
                        ">hide</a>]
                    </span>
                    <ol id="page+toc+contents">${toc}</ol>
                </div>
            `;
            // Set TOC on page
            if (outText.includes('<toc></toc>')) outText = outText.replace('<toc></toc>', tocElem);
            else outText = outText.replace(/<h\d[^>]*>/, tocElem + '$&');
        }

        // Create plaintext of HTML for use as description/metadata property.
        const plaintextData = parsedContent.replace(/<.+?>/gs, ' ');

        // Create HTML
        const folderUpCount = file.split(/[\/\\]/).length - dir.split(/[\/\\]/).length; // number of folders to go up by to get to root
        const html = dedent`
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="initial-scale=1.0, width=device-width">
                    <meta name="description" content="${plaintextData.substring(0, 256)}...">
                    <title>${displayTitle}</title>
                    <link id="default-styles" rel="stylesheet" href="${'../'.repeat(folderUpCount)}./wiki.css">
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
        if (!fs.existsSync(paths.dirname(outFilePath))) {
            fs.mkdirSync(paths.dirname(outFilePath));
        }
        const formattedHtml = html.replace(/\n[\n\s]+/g, '\n');
        fs.writeFileSync(outFilePath, frontMatter + '\n' + formattedHtml, 'utf8');

        // Move images
        glob(imagesFolder + '/*', {}, (err, files) => {
            if (err) {
                console.warn(err);
            }
            if (!fs.existsSync(outputImagesFolder)) {
                fs.mkdirSync(outputImagesFolder);
            }
            for (const file of files) {
                fs.copyFileSync(file, paths.join(outputImagesFolder, paths.basename(file)))
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
            const cssOutput = config.eleventy ? ['---', 'permalink: /wiki.css', '---', styles].join('\n') : styles;
            const cssOutFilename = config.eleventy ? 'wiki.css.njk' : 'wiki.css';
            fs.writeFileSync(paths.join(outputFolder, cssOutFilename), cssOutput);
        }

    });
}
