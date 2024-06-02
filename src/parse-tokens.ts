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
            // TODO frameless/border/thumb/etc; float; align, alt, style, class, upright 
            const width = token.width || 'auto';
            const height = token.height || 'auto';
            const file = token.name;
            const img = `<img src="${file}" alt="${file.replace('File:', '')}" width="${width}" height="${height}">`;
            if (token.link) return `<a class="internal-link" href="${token.link}">${img}</a>`;
            return img;
        },
        'table': () => {
            const [_open, attrs, ...cells] = token.childNodes.map(parseToken);
            return htmlElem('table', attrs, cells.join(''));
        },
        'tr': () => {
            const [_open, attrs, ...cells] = token.childNodes.map(parseToken);
            return htmlElem('tr', attrs, cells.join(''));
        },
        'td': () => {
            const { subtype } = token;
            const [_open, attrs, ...cells] = token.map(parseToken);
            return htmlElem(subtype, attrs, cells.join(''));
        },
        'table-syntax': () => '',
        'double-underscore': () => {
            // __NOTOC__, __NOINDEX__, etc
            const { name } = token;
            metadata[name] = true;
            return htmlElem(name);
        },
        'magic-word': () => {
            const [_nameToken, ...paramTokens]: string[] = token.childNodes;
            const [_name, ...params]: string[] = token.childNodes.map(parseToken)
                .map((item: string) => /^\s+$/.test(item) ? ' ' : item.trim());
            const [param] = params;
            const d = new Date();
            switch (token.name) {
                // Parser functions: built-in
                case 'lc': {
                    // @changelog CHANGE: no longer allows '#lc'
                    return param.toLowerCase();
                }
                case 'uc': {
                    // @changelog CHANGE: no longer allows '#uc'
                    return param.toUpperCase();
                }
                case 'lcfirst': {
                    // @changelog CHANGE: no longer allows '#'
                    return param[0].toLowerCase() + param.slice(1);
                }
                case 'ucfirst': {
                    // @changelog CHANGE: no longer allows '#'
                    return param[0].toUpperCase() + param.slice(1);
                }
                case 'padleft': {
                    const [text, size, filler] = params;
                    // @changelog CHANGE: no longer allows '#'
                    return text.padStart(+size, filler);
                }
                case 'padright': {
                    const [text, size, filler] = params;
                    // @changelog CHANGE: no longer allows '#'
                    return params[0].padEnd(+size, filler);
                }
                case 'urlencode': {
                    // @changelog CHANGE: no longer allows '#'
                    // @changelog REMOVE urldecode
                    return encodeURIComponent(param);
                }
                case 'urldecode': {
                    // @changelog CHANGE: now requires '#'
                    return decodeURIComponent(param);
                }
                // Parser functions: string functions
                case 'len': {
                    return param.length.toString();
                }
                case 'pos': {
                    const [text, substring] = params;
                    return text.indexOf(substring).toString();
                }
                case 'rpos': {
                    // @changelog NEW
                    const [text, substring] = params;
                    return text.lastIndexOf(substring).toString();
                }
                case 'sub': {
                    const [text, startstr, lengthstr] = params;
                    const start = +startstr;
                    const length = +lengthstr;
                    if (start < 0) {
                        if (!length) {
                            // {{#sub:texting|-2}}=ng
                            return text.slice(text.length + start);
                        }
                        else if (length < 0) {
                            // {{#sub:texting|-2|-1}}=n_
                            return text.slice(text.length + start, text.length + length);
                        }
                        else {
                            // {{#sub:texting|-2|2}}=ng
                            return text.slice(text.length + start, text.length + start + length);
                        }
                    }
                    else {
                        if (!length) {
                            // {{#sub:texting|2}}=__xting
                            return text.slice(start);
                        }
                        else if (length < 0) {
                            // {{#sub:texting|2|-2}}=__xti__
                            return text.slice(start, text.length + length);
                        }
                        else {
                            // {{#sub:texting|2|2}}=__xt
                            return text.slice(start, start + length);
                        }
                    }
                }
                case 'count': {
                    // @changelog NEW
                    const [text, substring] = params;
                    return (text.split(substring).length - 1).toString();
                }
                case 'replace': {
                    const [text, search, replacer] = params;
                    return text.replaceAll(search, replacer);
                }
                case 'explode': {
                    const [text, delimiter, pos, limit] = params;
                    let arr = text.split(delimiter);
                    if (limit) {
                        // Joins all items in the array after the limit length into the same cell
                        arr[+limit - 1] = arr.slice(+limit - 1).join(delimiter);
                        arr.length = +limit;
                    }
                    return arr[+pos];
                }
                // Parser functions: extension
                case 'expr': {
                    // TODO
                    return htmlElem('UNIMPLEMENTED', `expr="${param}"`, '');
                }
                case 'if': {
                    const [check, iftrue = '', iffalse = ''] = params;
                    const result = check.trim() ? iftrue : iffalse;
                    return result ?? '';
                }
                case 'ifeq': {
                    const [check1, check2, iftrue = '', iffalse = ''] = params;
                    if (!isNaN(+check1) && !isNaN(+check2)) {
                        // numerical check
                        return +check1 === +check2 ? iftrue : iffalse;
                    } else {
                        // text check
                        return check1.trim() === check2.trim() ? iftrue : iffalse;
                    }
                }
                case 'iferror': {
                    const [check, iftrue = '', iffalse = ''] = params;
                    return check.includes(`class="error"`) ? iftrue : iffalse;
                }
                case 'ifexpr': {
                    // TODO
                    return htmlElem('UNIMPLEMENTED', `ifexpr="${param}"`, '');
                }
                case 'ifexist': {
                    // TODO
                    const [check, iftrue = '', iffalse = ''] = params;
                    return iftrue;
                }
                case 'rel2abs': {
                    // TODO
                    const [path, basePath] = params;
                    return path;
                }
                case 'switch': {
                    const [_itemToken, ...optionsTokens] = paramTokens;
                    const [item] = params;
                    const options = optionsTokens.map((token: AnyToken) => parseToken(token.firstChild) + '=' + parseToken(token.lastChild));
                    for (const option of options) {
                        const [key, value] = option.split('=');
                        if (item.trim() === key.trim()) {
                            return value;
                        }
                    }
                    return '';
                }
                case 'time': {
                    const [fmtstr, datetime, langcode, local] = params;
                    return htmlElem('UNIMPLEMENTED', `str="${fmtstr}" datetime="${datetime}" lang="${langcode}" local="${local}"`, '');
                }
                case 'timel': {
                    const [fmtstr, datetime, langcode] = params;
                    return htmlElem('UNIMPLEMENTED', `str="${fmtstr}" datetime="${datetime}" lang="${langcode}" local="true"`, '');
                }
                case 'timel': {
                    const [fmtstr, datetime, langcode] = params;
                    return htmlElem('UNIMPLEMENTED', `str="${fmtstr}" datetime="${datetime}" lang="${langcode}" local="true"`, '');
                }
                case 'titleparts': {
                    const [pagename, count, startSegment] = params;
                    const parts = pagename.split('/');
                    if (!count) {
                        return pagename;
                    }
                    else if (!startSegment) {
                        return parts.slice(0, +count).join('/');
                    }
                    else {
                        return parts.slice(+startSegment - 1, +count).join('/');
                    }
                }
                // Magic words
                case 'pagename': {
                    // @changelog NEW
                    return htmlElem('UNIMPLEMENTED');
                }
                case 'currentyear':
                case 'localyear': {
                    return d.getFullYear().toString();
                }
                case 'currentmonth':
                case 'currentmonth2':
                case 'localmonth':
                case 'localmonth2': {
                    return (d.getMonth() + 1).toString().padStart(2, '0');
                }
                case 'currentmonth1':
                case 'localmonth1': {
                    return (d.getMonth() + 1).toString();
                }
                case 'currentmonthname':
                case 'currentmonthnamegen':
                case 'localmonthname':
                case 'localmonthnamegen': {
                    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                    return months[d.getMonth()];
                }
                case 'currentmonthabbrev':
                case 'localmonthabbrev': {
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return months[d.getMonth()];
                }
                case 'currentday':
                case 'localday': {
                    return d.getDate().toString();
                }
                case 'currentday2':
                case 'localday2': {
                    return d.getDate().toString().padStart(2, '0');
                }
                case 'currentdow':
                case 'localdow': {
                    return d.getDay().toString();
                }
                case 'currentdow':
                case 'localdow': {
                    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    return days[d.getDay()];
                }
                case 'currenttime':
                case 'localtime': {
                    return [d.getHours(), d.getMinutes()].map(num => num.toString().padStart(2, '0')).join(':');
                }
                case 'currenthour':
                case 'localhour': {
                    return d.getHours().toString().padStart(2, '0');
                }
                case 'currentweek':
                case 'localweek': {
                    return htmlElem('UNIMPLEMENTED');
                }
                case 'currenttimestamp':
                case 'localtimestamp': {
                    return [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()]
                        .map(num => num.toString().padStart(2, '0'))
                        .join('');
                }
                // Other
                default: {
                    return htmlElem('UNIMPLEMENTED', `magic-word="${_name}"`, params.join('|'));
                }
            }
        },

        // Templates
        'template': () => {
            // TODO
            const templateName = parseToken(token.firstChild);
            return htmlElem('TRANSCLUSION', `template="${templateName}"`, '');
        },

        // Wiki-HTML
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
        // Misc
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
