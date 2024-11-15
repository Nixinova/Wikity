import fs from 'fs';
import paths from 'path';
import htmlEscape from 'escape-html';
import dateFormat from 'dateformat';

import { Config, Result, Metadata, RegExpBuilder as re } from './common';

const r = String.raw;
const MAX_RECURSION: number = 20;
const arg: string = r`\s*([^|}]+?)\s*`;

function toLinkText(link: string) {
    const cleanedLink = encodeURI(link.trim().replace(/ /g, '_'));
    return cleanedLink[0].toUpperCase() + cleanedLink.slice(1);
}

function toFileText(link: string) {
    const cleanedLink = link.trim().replace(/ /g, '_');
    return cleanedLink[0].toUpperCase() + cleanedLink.slice(1);
}

function parseDimensions(dimStr: string) {
    const regex = /(\d*)(?:x(\d*))?px/;
    const match = dimStr.match(regex);
    if (!match) return { width: 'auto', height: 'auto' };
    const [, width, height] = match;
    return {
        width: width || 'auto',
        height: height || 'auto',
    };
}

const escaper = (text: string, n: number = 0) => `%${text}#${n}`;

export function rawParse(data: string, config: Config = {}): string {
    return parse(data, config).data;
}

export function parse(data: string, config: Config = {}): Result {
    const KEY = Math.random().toString().slice(2); // key used to allow certain disallowed HTML elements

    const templatesFolder = config.templatesFolder ?? 'templates';
    const imagesFolder = config.imagesFolder ?? 'images';
    const outputFolder = config.outputFolder ?? 'wikity-out';

    const vars: Metadata = {};
    const metadata: Metadata = {};
    const nowikis: string[] = [];
    const refs: Array<{ ref: string, id: number, name: string, i: number }> = [];
    let nowikiCount: number = 0;
    let rawExtLinkCount: number = 0;

    let outText: string = data;

    for (let l = 0, last = ''; l < MAX_RECURSION; l++) {
        if (last === outText) break;
        last = outText;

        outText = outText

            // Nowiki: <nowiki></nowiki>
            .replace(re(r`<nowiki> ([^]+?) </nowiki>`), (_, m) => (nowikis.push(m), escaper('NOWIKI', nowikiCount++)))

            // Sanitise unacceptable HTML
            .replace(re(r`< \s* (?= (?: script|link|meta|iframe|frameset|object|embed|applet|form|input|button|textarea ) (?! \s* key.{0,10}${KEY}) )`), '&lt;')
            .replace(re(r`(?<= <[^>]+ ) (\bon(\w+))`), 'data-$2')

            // Comments: <!-- -->
            .replace(/<!--[^]+?-->/g, '')

            // Lines: ----
            .replace(/^-{4,}/gm, '<hr>')

            // Images: [[File:Image.png|options|caption]]
            .replace(re(r`\[\[ (?:File|Image): (.*?) (\|.+?)? \]\]`), (_, file, params = '') => {
                if (params.includes('{{')) return _;
                if (params.includes('[[')) return _;
                if (!file) return '';

                const path: string = paths.join(imagesFolder, file.trim().replace(/ /g, '_'));
                let caption: string = '';
                let imageData: { [key: string]: any } = {};
                let imageArgs: string[] = params.split('|').map((arg: string) => arg.replace(/"/g, '&quot;'));
                for (const param of imageArgs) {
                    if (['left', 'right', 'center', 'none'].includes(param)) {
                        imageData.float = param;
                    }
                    if (['baseline', 'sub', 'super', 'top', 'text-bottom', 'middle', 'bottom', 'text-bottom'].includes(param)) {
                        imageData.align = param;
                    }
                    else if (['border', 'frameless', 'frame', 'framed', 'thumb', 'thumbnail'].includes(param)) {
                        imageData.type = { framed: 'frame', thumbnail: 'thumb' }[param] || param;
                        if (imageData.type === 'thumb') {
                            imageData.hasCaption = true;
                            imageData.float ??= 'right';
                        }
                    }
                    else if (param.endsWith('px')) {
                        const { width, height } = parseDimensions(param);
                        imageData.width = width;
                        imageData.height = height;
                    }
                    else if (param.startsWith('upright=')) {
                        imageData.width = +param.replace('upright=', '') * 300;
                    }
                    else if (param.startsWith('link=')) {
                        imageData.link = param.replace('link=', '');
                    }
                    else if (param.startsWith('alt=')) {
                        imageData.alt = param.replace('alt=', '');
                    }
                    else if (param.startsWith('style=')) {
                        imageData.style = param.replace('style=', '');
                    }
                    else if (param.startsWith('class=')) {
                        imageData.class = param.replace('class=', '');
                    }
                    else {
                        caption = param;
                    }
                }
                let content = `
                    <figure
                        class="
                            ${imageData.class || ''}
                            image-container
                            image-${imageData.type || 'default'}
                        "
                        style="
                            margin: 8px;
                            float: ${imageData.float || 'none'};
                            clear: ${imageData.float || 'none'};
                            vertical-align: ${imageData.align || 'unset'};
                            background: #fff;
                            ${imageData.style || ''}
                        "
                    >
                        <img
                            src="${paths.basename(imagesFolder)}/${paths.relative(imagesFolder, path)}"
                            alt="${imageData.alt || file}"
                            width="${imageData.width || 300}"
                            height="${imageData.height || ''}"
                        >
                        ${imageData.hasCaption ? `<figcaption>${caption}</figcaption>` : ''}
                    </figure>
                `;
                const imageLink = imageData.link;
                if (imageLink) {
                    content = `<a href="${toLinkText(imageLink)}" title="${imageLink}">${content}</a>`;
                }
                return content;
            })

            // Internal links
            // [[Page]]
            .replace(re(r`\[\[ ([^\]|]+?) \]\]`), (_, link) => {
                if (_.includes('{{')) return _;
                if (/(?:File|Image):/.test(link)) return _;
                const content = `<a class="internal-link" title="${link}" href="./${toLinkText(link)}">${link}</a>`;
                return content;
            })
            // [[Page|Text]]
            .replace(re(r`\[\[ ([^\]|]+?) \| ([^\]]+?) \]\]`), (_, link, text) => {
                if (link.includes('{{')) return _;
                if (/(?:File|Image):/.test(link)) return _;
                const content = `<a class="internal-link" title="${link}" href="./${toLinkText(link)}">${text}</a>`;
                return content;
            })
            .replace(re(r`(</a>)([a-z]+)`), '$2$1')

            // External links: [href Page] and just [href]
            .replace(re(r`\[ ((?:\w+:)?\/\/ [^\s\]]+) (\s [^\]]+?)? \]`), (_, href, txt) => {
                if (_.includes('{{')) return _;
                const content = `<a class="external-link" href="${href}">${txt || '[' + (++rawExtLinkCount) + ']'}</a>`
                return content;
            })

            // Magic words: {{!}}, {{reflist}}, etc
            .replace(re(r`{{ \s* ! \s* }}`), escaper('VERT'))
            .replace(re(r`{{ \s* !! \s* }}`), escaper('VERT').repeat(2))
            .replace(re(r`{{ \s* = \s* }}`), escaper('EQUALS'))
            .replace(re(r`{{ \s* [Rr]eflist \s* }}`), '<references/>')

            // Metadata: displayTitle, __NOTOC__, etc
            .replace(re(r`{{ \s* displayTitle: ([^}]+) }}`), (_, title) => (metadata.displayTitle = title, ''))
            .replace(re(r`__NOINDEX__`), () => (metadata.noindex = true, ''))
            .replace(re(r`__NOTOC__`), () => (metadata.notoc = true, ''))
            .replace(re(r`__FORCETOC__`), () => (metadata.toc = true, ''))
            .replace(re(r`__TOC__`), () => (metadata.toc = true, `<toc></toc>`))

            // String functions: {{lc:}}, {{ucfirst:}}, {{len:}}, etc
            .replace(re(r`{{ \s* #? urlencode: ${arg} }}`), (_, m) => encodeURI(m))
            .replace(re(r`{{ \s* #? urldecode: ${arg} }}`), (_, m) => decodeURI(m))
            .replace(re(r`{{ \s* #? lc: ${arg} }}`), (_, m) => m.toLowerCase())
            .replace(re(r`{{ \s* #? uc: ${arg} }}`), (_, m) => m.toUpperCase())
            .replace(re(r`{{ \s* #? lcfirst: ${arg} }}`), (_, m) => m[0].toLowerCase() + m.substr(1))
            .replace(re(r`{{ \s* #? ucfirst: ${arg} }}`), (_, m) => m[0].toUpperCase() + m.substr(1))
            .replace(re(r`{{ \s* #? len: ${arg} }}`), (_, m) => m.length)
            .replace(re(r`{{ \s* #? pos: ${arg} \|${arg} (?: \s*\|${arg} )? }}`), (_, find, str, n = 0) => find.substr(n).indexOf(str))
            .replace(re(r`{{ \s* #? sub: ${arg} \|${arg} (?:\|${arg})? }}`), (_, str, from, len) => str.substr(+from - 1, +len))
            .replace(re(r`{{ \s* #? padleft: ${arg} \|${arg} \|${arg} }}`), (_, str, n, char) => str.padStart(+n, char))
            .replace(re(r`{{ \s* #? padright: ${arg} \|${arg} \|${arg} }}`), (_, str, n, char) => str.padEnd(+n, char))
            .replace(re(r`{{ \s* #? replace: ${arg} \|${arg} \|${arg} }}`), (_, str, find, rep) => str.split(find).join(rep))
            .replace(re(r`{{ \s* #? explode: ${arg} \|${arg} \|${arg} }}`), (_, str, delim, pos) => str.split(delim)[+pos])

            // Magic functions: {{#ev:youtube}}, etc
            .replace(re(r`{{ \s* #? ev: \s* (\w+) \s* \| \s* ( [^{}]+ ) \s* }} ( ?!} )`), (_, platform: string, args: string) => {
                // See mediawiki.org/wiki/Extension:EmbedVideo_(fork) for docs
                const params = args.split('|');
                for (let i = 0; i < 10; i++) params[i] ??= ''; // fill up with empty strings

                const [id, dimensions, alignment, description, container, urlargs, autoresize] = params;
                const { width, height } = parseDimensions(dimensions);
                const source = {
                    // Add platforms
                    'youtube': `//www.youtube.com/embed/${id}`,
                    'vimeo': `//player.vimeo.com/video/${id}`,
                }[platform];
                if (!source) return `<code>Failed to load video ${id} from ${platform}.</code>`;
                return `
                    <iframe key="${KEY}"
                        src="${source}"
                        width="${width}"
                        height="${height}"
                        frameborder="0"
                        allowfullscreen="true"
                        loading="lazy"
                        title="${description ?? 'Play video'}"
                        ${alignment ? `style="float: ${alignment};"` : ''}
                    >
                    </iframe>
                    ${description ? `<figcaption>${description}</figcaption>` : ''}
                `;
            })

            // Parser functions: {{#if:}}, {{#switch:}}, etc
            .replace(re(r`{{ \s* (#\w+) \s* : \s* ( [^{}]+ ) \s* }} ( ?!} )`), (_, name, content) => {
                if (content.includes('{{')) return _;

                const args: string[] = content.trim().split(/\s*\|\s*/);
                switch (name) {
                    case '#if':
                        return (args[0] ? args[1] : args[2]) || '';
                    case '#ifeq':
                        return (args[0] === args[1] ? args[2] : args[3]) || '';
                    case '#vardefine':
                        vars[args[0]] = args[1] || '';
                        return '';
                    case '#var':
                        if (re(r`{{ \s* #vardefine \s* : \s* ${args[0]}`).test(outText)) return _; // wait until var is set
                        return vars[args[0]] || args[1] || '';
                    case '#switch':
                        return args.slice(1)
                            .map(arg => arg.split(/\s*=\s*/))
                            .filter(duo => args[0] === duo[0].replace('#default', args[0]))[0][1];
                    case '#time':
                    case '#date':
                    case '#datetime':
                        // make sure the characters are not inside a string
                        let parsedMatch = args[0].replace(/".+?"/g, '').replace(/'.+?'/g, '');
                        if (/[abcefgijkqruvx]/i.test(parsedMatch)) {
                            const errMsg = `Wikity does not use Wikipedia's #time function syntax. Use repetition-based formatting (e.g. yyyy-mm-dd) instead.`;
                            console.warn(`<Wikity> [WARN] ${errMsg}`);
                        }
                        try {
                            return dateFormat(args[1] ? new Date(args[1]) : new Date(), args[0]);
                        }
                        catch {
                            return args[1] || args[0];
                        }
                }
            })

            // Templates: {{template}}
            .replace(re(r`(?<!{) {{ \s* ([^#{}|]+?) \s* (\|[^{}]+)? }} (?!})`), (_, title, params = '') => {
                if (params.includes('{{')) return _;

                const templateFile = toFileText(title);
                const page: string = paths.join(templatesFolder, templateFile);
                let content = '';
                // Try retrieve template content
                try {
                    content = fs.readFileSync(page + '.wiki', { encoding: 'utf8' })
                }
                catch {
                    // Return redlink if template doesn't exist
                    const relPage = paths.basename(templatesFolder) + '/' + paths.relative(templatesFolder, page);
                    return `<a class="internal-link redlink" title="${title}" href="${relPage}">${title}</a>`;
                }

                // Remove non-template sections
                content = content.trim()
                    .replace(/<noinclude>.*?<\/noinclude>/gs, '')
                    .replace(/.*<(includeonly|onlyinclude)>|<\/(includeonly|onlyinclude)>.*/gs, '')

                // Substitute arguments
                const argMatch = (arg: string): RegExp => re(r`{{{ \s* ${arg} (?:\|([^}]*))? \s* }}}`);
                const args: string[] = params.split('|');
                // parse provided key=value template arguments
                for (let i = 1; i < args.length; i++) {
                    const data = args[i];
                    const parts = data.split('=');
                    const isNamed = parts.length > 1;
                    const arg = isNamed ? parts[0] : i.toString();
                    const val = isNamed ? parts.slice(1).join('=') : data;
                    content = content.replace(argMatch(arg), (_, defaultVal) => (val || defaultVal || '').trim());
                }

                return content;
            })

            // Unparsed arguments
            .replace(re(r`{{{ \s* [^{}|]+? (?:\|([^}]*))? \s* }}}`), (_, defaultVal) => {
                return defaultVal ?? '';
            })

            // Markup: '''bold''' and '''italic'''
            .replace(re(r`''' ([^']+?) '''`), '<b>$1</b>')
            .replace(re(r`''  ([^']+?)  ''`), '<i>$1</i>')

            // Headings: ==heading==
            .replace(re(r`^ (=+) \s* (.+?) \s* \1 \s* $`), (_, lvl, txt) => {
                const linkForm = encodeURI(txt.replace(/ /g, '_').replace(/<.+?>/g, ''));
                return `<h${lvl.length} auto id="${linkForm}">${txt}</h${lvl.length}>`;
            })

            // Bulleted list: *item
            .replace(re(r`^ (\*+) (.+?) $`), (_, lvl, content) => {
                if (content.includes('{{')) return _;
                const depth = lvl.length;
                return `${'<ul>'.repeat(depth)}<li>${content}</li>${'</ul>'.repeat(depth)}`;
            })
            .replace(re(r`</ul> (\s*?) <ul>`), '$1')

            // Numbered list: #item
            .replace(re(r`^ (#+) (.+?) $`), (_, lvl, content) => {
                if (content.includes('{{')) return _;
                const depth = lvl.length;
                return `${'<ol>'.repeat(depth)}<li>${content}</li>${'</ol>'.repeat(depth)}`;
            })
            .replace(re(r`</ol> (\s*?) <ol>`), '$1')

            // Definition list: ;head, :item
            .replace(re(r`^ ; (.+?) : (.+?) $`), `<dl><dt>$1</td><dd>$2</dd></dl>`)
            .replace(re(r`^ (:+) (.+?) $`), (_, lvl, content) => {
                if (content.includes('{{')) return _;
                const depth = lvl.length;
                return `${'<dl>'.repeat(depth)}<dd>${content}</dd>${'</dl>'.repeat(depth)}`;
            })
            .replace(re(r`^ ; (.+) $`), '<dl><dt>$1</dt></dl>')
            .replace(re(r`</dl> (\s*?) <dl>`), '$1')

            // Tables: {|, |+, !, |-, |, |}
            .replace(/\{\|.+\|\}/gs, (tableInner) => {
                if (tableInner.includes('{{')) return tableInner;
                return tableInner
                    // {| data (open table)
                    .replace(re(r`^ \{\| (.*?) $`), (_, attrs) => `<table ${attrs}><tr>`)
                    // |+ data
                    .replace(re(r`^ \|\+ (.*?) $`), (_, content) => `<caption>${content}</caption>`)
                    // |- (new row)
                    .replace(re(r`^ \|- (.*?) $`), (_, attrs) => `</tr><tr ${attrs}>`)
                    // |} (close)
                    .replace(re(r`^ \|\}`), `</tr></table>`)
                    // content: !head, !data|head, |text, |data|text, !!head, ||data
                    .replace(re(r`( ^! | ^\| | !! | \|\| ) (?: ( [^|\n]+? ) \|)? ( [^|\n]*? ) (?= $ | !! | \|\| )`), (_, type, data, content) => {
                        const elem = /!/.test(type) ? 'th' : 'td';
                        return `<${elem} ${data ?? ''}>${content}</${elem}>`;
                    })
            })

            // References: <ref></ref>
            .replace(re(r`< ref \s* (?: name \s* = \s* ["']? ([^>'"]+) ["']? [^>]* )?> (.+?) </ ref >`), (_, refname, text) => {
                if (_.includes('{{')) return _;

                const refData = { ref: text, id: refs.length + 1, name: refname, i: 0 };
                refs.push(refData);
                return `<sup class="refnote"><a id="cite-${refData.id}" class="ref" href="#ref-${refData.id}">[${refData.id}]</a></sup>`;
            })
            .replace(re(r`< ref \s* name \s* = \s* ["']? ( [^>"']+ ) ["']? \s* (?: /> | > .*? </ref> )`), (_, refname) => {
                const ref = refs.find(ref => ref.name === refname);
                if (!ref) return _;
                ref.i++;
                const citeId = `cite-${ref.id}${ref.i > 0 ? `_${ref.i}` : ''}`
                return `<sup class="refnote"><a id="${citeId}" class="ref" href="#ref-${ref.id}">[${ref.id}]</a></sup>`;
            })

            // Nonstandard: ``code`` and ```code blocks```
            .replace(re(r` \`\`\` ([^\`]+?) \`\`\` `), '<pre>$1</pre>')
            .replace(re(r` \`\` ([^\`]+?) \`\` `), '<code>$1</code>')

            // Spacing
            .replace(/(\r?\n){2}/g, '\n</p><p>\n')

    }

    // Final (one-time) substitutions

    for (let i = 0; i < nowikis.length; i++) {
        outText = outText
            // Restore nowiki contents
            .replace(escaper('NOWIKI', i), nowikis[i])
    }
    outText = outText
        // References: <references />
        .replace(re(r`<references \s* /?>`), () => {
            const references = refs.map((refdata) => {
                let multiRefContent = '';
                if (refdata.i > 0) {
                    for (let i = 0; i <= refdata.i; i++) {
                        multiRefContent += `<sup><a href="#cite-${refdata.id}${i > 0 ? `_${i}` : ''}">${i + 1}</a></sup>&nbsp;`;
                    }
                }
                const refline = `
                    <li id="ref-${refdata.id}">
                        ${refdata.i > 0 ? '&uarr;' : `<a href="#cite-${refdata.id}">&uarr;</a>`}
                        ${multiRefContent}
                        ${refdata.ref} 
                    </li>
                `;
                return refline;
            }).join('\n');
            return `<ol>${references}</ol>`;
        })
        // Magic word functions
        .replaceAll(escaper('VERT'), '|')
        .replaceAll(escaper('EQUALS'), '=')

    // Escape all {{ to avoid crashes
    outText = outText
        .replaceAll('{{', '&#123;&#123;')

    const result: Result = { data: outText, metadata: metadata };
    return result;
}
