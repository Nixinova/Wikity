import wikiparser, { Token, AstNodes } from 'wikiparser-node';

import { Config, Result, Metadata } from './common';

let metadata: Metadata;

function parseTokenTree(rootToken: Token | AstNodes): string {
    let outText = '';
    for (const token of rootToken.childNodes) {
        outText += parseToken(token);
    }
    return outText;
}

function parseToken(token: any): string {
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
        'attr-key': () => `${parseChildren()}="`,
        'attr-value': () => `${parseChildren()}"`,
        'hr': () => '<hr>',

        // Wikitext
        'heading': () => {
            // h1, h2, h3, ...
            return `<h${token.level}>${parseChildren()}</h${token.level}>`
        },
        'list': () => {
            // lists that start on new line
            const elem = token.dt ? 'dt' : token.dd ? 'dd' : token.ul ? 'ul' : token.ol ? 'ol' : NaN;
            return `<POSTPARSE ${elem} ${token.firstChild.data.length}></POSTPARSE>`;
        },
        'dd': () => `<POSTPARSE dd></POSTPARSE>`,
        'double-underscore': () => {
            // __NOTOC__, __NOINDEX__, etc
            const { name } = token;
            metadata[name] = true;
            return `<${name}></${name}>`;
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
