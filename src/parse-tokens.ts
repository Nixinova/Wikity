import wikiparser, { Token, AstNodes } from 'wikiparser-node';

import { Config, Result, Metadata } from './common';

type AnyToken = any;

interface RefData {
    [group: string]: Array<{
        content: string,
        name: string,
    }>
};
const references: RefData = {};

let metadata: Metadata;

const sanitAttr = (data: string) => data.replace(/\b(on\w+|javascript:|formaction)\b/g, 'data-$&');
const htmlElem = (name: string, attr = '', body = '') => `<${name} ${sanitAttr(attr)}>${body}</${name}>`;

function parseTokenTree(rootToken: Token | AstNodes): string {
    let outText = '';
    for (const token of rootToken.childNodes) {
        outText += parseToken(token);
    }
    return outText;
}

function parseToken(token: AnyToken): string {
    const parseChildren = () => parseTokenTree(token);

    // Parsing for specific types of token
    const parseActions: { [type: string]: () => string } = {

        // Raw text //
        'text': () => {
            const { data, bold, italic } = token;
            if (bold && italic) return `<b><i>${data}</i></b>`;
            if (bold) return `<b>${data}</b>`;
            if (italic) return `<i>${data}</i>`;
            return `${data}`;
        },

        // Raw HTML //
        'html': () => {
            if (token.closing) return `</${token.name}>`;
            return `<${token.name} ${parseChildren()}>`;
        },
        'attr-key': () => `${sanitAttr(parseChildren())}="`,
        'attr-value': () => `${sanitAttr(parseChildren())}"`,
        'hr': () => '<hr>',

        // Wikitext
        'heading': () => {
            // h1, h2, h3, ...
            return htmlElem('h' + token.level, '', parseChildren());
        },
        'list': () => {
            // lists that start on new line
            const elem = token.dt ? 'dt' : token.dd ? 'dd' : token.ul ? 'ul' : token.ol ? 'ol' : NaN;
            return htmlElem('POSTPARSE', elem + ' ' + token.firstChild.data.length, '');
        },
        'dd': () => htmlElem('POSTPARSE', 'dd', ''),
        'link': () => {
            // Internal link
            if (token.selfLink) return `<b>${token.innerText}</b>`;
            return `<a class="internal-link" href="${token.name}">${token.innerText}</a>`;
        },
        'ext-link': () => {
            // External link
            return `<a class="external-link" href="${token.firstChild}">${token.innerText}</a>`;
        },
        'file': () => {
            const width = token.width || 'auto';
            const height = token.height || 'auto';
            const file = token.name;
            const img = `<img src="${file}" alt="${file.replace('File:', '')}" width="${width}" height="${height}">`;
            if (token.link) return `<a class="internal-link" href="${token.link}">${img}</a>`;
            return img;
        },
        'table': () => {
            const [_open, attrs, ...cells] = token.childNodes;
            const body = cells.map((token: AnyToken) => parseToken(token)).join('');
            return htmlElem('table', parseToken(attrs), body);
        },
        'tr': () => {
            const [_open, attrs, ...cells] = token.childNodes;
            const body = cells.map((token: AnyToken) => parseToken(token)).join('');
            return htmlElem('tr', parseToken(attrs), body);
        },
        'td': () => {
            const { subtype } = token;
            const [_open, attrs, ...cells] = token.childNodes;
            const body = cells.map((token: AnyToken) => parseToken(token)).join('');
            return htmlElem(subtype, parseToken(attrs), body);
        },
        'table-syntax': () => '',
        'ext': () => {
            // Nonstandard HTML elements
            switch (token.name) {
                case 'ref': {
                    const [attrs, content] = token.childNodes.map(parseToken);
                    const group = attrs.match(/group=(['"])?([^'"]+?)\1/)?.[2] ?? '';
                    const name = attrs.match(/name=(['"])?([^'"]+?)\1/)?.[2];
                    let n;
                    if (content) {
                        references[group] ??= [];
                        references[group].push({ content, name });
                        n = references[group].length;
                    } else {
                        n = references[group].findIndex((data) => data.name === name) + 1;
                    }
                    return `<sup><a group="${group}" id="#cite-${group}${n}" href="#ref-${group}${n}">[${group ? group + ' ' : ''}${n}]</a></sup>`;
                }
                case 'references': {
                    const [attrs, _content] = token.childNodes.map(parseToken);
                    const group = attrs.match(/group=(['"])?([^'"]+?)\1/)?.[2] ?? '';

                    let outText = '';
                    for (const [n, { content }] of Object.entries(references[group])) {
                        outText += `<li>${+n + 1}. <a id="#ref-${group}${n}" href="#cite-${group}${n}">^</a> ${content}`;
                    }
                    return htmlElem('ul', `class="reflist" group="${group}"`, outText);
                }
                default: {
                    const [attrs, content] = token.childNodes.map(parseToken);
                    return htmlElem(token.name, attrs, content);
                }
            }
        },
        'double-underscore': () => {
            // __NOTOC__, __NOINDEX__, etc
            const { name } = token;
            metadata[name] = true;
            return htmlElem(name);
        },
        'quote': () => '',

        // Fallback //
        DEFAULT: parseChildren,

    }
    const parseFunc = parseActions[token.type.toString()] ?? parseActions.DEFAULT;
    return parseFunc();
}

function postParsing(data: string) {
    return data
        // When tokens' content runs to the end of the line
        .replace(/^<POSTPARSE (ol|ul) (\d)><\/POSTPARSE>(.+)$/gm, (_, elem, lvl, txt) => {
            return `${`<${elem}><li>`.repeat(lvl)}${txt}${`</li></${elem}>`.repeat(lvl)}`;
        })
        .replace(/^<POSTPARSE (dt|dd) (\d)><\/POSTPARSE>(.+)$/gm, (_, elem, lvl, txt) => {
            return `${`<dl><${elem}>`.repeat(lvl)}${txt}${`</${elem}></dl>`.repeat(lvl)}`;
        })
        // Merge list contents together
        .replace(/<\/(dl|ul|ol)>\s*<\1>/gm, '\n')
        .replace(/<\/(dl|ul|ol)>\s*<\/(li|dd)>\s*<\2>\s*<\1>/gm, '\n')
        .replace(/<\/(li|dd)>\s*<\1>\s*(?=<(dl|ul|ol)>)/gm, '\n')
        // Remove HTML interactive elements
        .replace(/<(\/)?(n?o?script|iframe|embed|object|applet|frame|frameset|link|meta|style)(.*?)>/g, '<$1SANITIZED $2 $3>')
}

export function rawParse(data: string, config: Config = {}): string {
    return parse(data, config).data;
}

export function parse(data: string, config: Config = {}): Result {
    metadata = {}; // reset global

    const tokens = wikiparser.parse(data);
    console.debug(JSON.stringify(tokens, null, 5))

    const parsed = parseTokenTree(tokens);
    const postParsed = postParsing(parsed);

    const outText = postParsed;
    const result: Result = { data: outText, metadata: metadata };
    return result;
}
