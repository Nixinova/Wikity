const fs = require('fs');

const re = (regex: string, flag: string = 'mgis') => RegExp(regex.replace(/ /g, '').replace(/\|\|.+?\|\|/g, ''), flag);
const r = String.raw;

export function parse(data: string): string {

    const MAX_RECURSION: number = 50;
    const vars: Record<string, any> = {};
    let rawExtLinkCount: number = 0;
    let refCount: number = 0;
    let refs: string[] = [];

    let outText: string = data

    for (let l = 0, last = ''; l < MAX_RECURSION; l++) {
        if (last === outText) break; last = outText;

        outText = outText

            // Sanitise unacceptable HTML
            .replace(re(r`<(/?) \s* (?= script|link|meta|iframe|frameset|object|embed|applet|form|input|button|textarea )`), '&lt;$1')
            .replace(re(r`(?<= <[^>]+ ) (\bon(\w+))`), 'data-$2')

            // Comments: <!-- -->
            .replace(/<!--.+?-->/g, '')

            // Magic words: {{!}}, {{reflist}}, etc
            //.replace(re(r`{{ \s* displayTitle: ([^}]+) }}`), (_, title) => (displayTitle = title, ''))
            .replace(re(r`{{ \s* ! \s* }}`), '&vert;')
            .replace(re(r`{{ \s* = \s* }}`), '&equals;')
            .replace(re(r`{{ \s* [Rr]eflist \s* }}`), '<references/>')

            .replace(re(r`{{ \s* (#\w+) \s* : \s* ( [^{}]+ ) \s* }}  ( ?!} )`), (_, name, content) => {
                if (/{{\s*#/.test(content)) return _;
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
                        if (re(r`{{ \s* #vardefine \s* : \s* ${args[0]}`).test(outText)) return _;// wait until var is set
                        return vars[args[0]] || args[1] || '';
                    case '#switch':
                        return args.slice(1)
                            .map(arg => arg.split(/\s*=\s*/))
                            .filter(duo => args[0] === duo[0].replace('#default', args[0]))[0][1];
                    case '#time':
                    case '#date':
                    case '#datetime':
                        const date = args[1] ? new Date(args[1]) : new Date();
                        let [dow, month, day, year, time, tz, ...tzparts] = date.toString().split(' ');
                        const monthN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month) + 1 + "";
                        const [hr, min, sec] = time.split(':');
                        const tzID = tzparts.join().replace(/[^A-Z]/g, '');
                        return args[0]
                            .replace(/(?<!\\)[MF]/g, '\\' + month)
                            .replace(/(?<!\\)m/g, '\\' + monthN.padStart(2, '0'))
                            .replace(/(?<!\\)n/g, '\\' + monthN)
                            .replace(/(?<!\\)[Dl]/g, '\\' + dow)
                            .replace(/(?<!\\)d/g, _ => '\\' + day)
                            .replace(/(?<!\\)j/g, _ => '\\' + day.replace(/^0/, ''))
                            .replace(/(?<!\\)Y/g, '\\' + year)
                            .replace(/(?<!\\)y/g, '\\' + year.substr(2))
                            .replace(/(?<!\\)H/g, '\\' + hr)
                            .replace(/(?<!\\)G/g, '\\' + hr.replace(/^0/, ''))
                            .replace(/(?<!\\)h/g, '\\' + (+hr % 12).toString().replace(/^0$/, '12'))
                            .replace(/(?<!\\)g/g, '\\' + (+hr % 12).toString().replace(/^0$/, '12').replace(/^0/, ''))
                            .replace(/(?<!\\)i/g, '\\' + min)
                            .replace(/(?<!\\)s/g, '\\' + sec)
                            .replace(/(?<!\\)e/g, '\\' + tzID)
                            .replace(/(?<!\\)P/g, '\\' + tz)
                            .replace(/(?<!\\)O/g, '\\' + tz.replace(':', ''))
                            .replace(/(?<!\\)t/g, '\\' + time)
                            .replace(/\\/g, '')
                }
            })

            // Templates: {{template}}
            .replace(re(r`{{ \s* ([^#}|]+?) (\|[^}]+)? }} (?!})`), (_, title, params = '') => {
                if (/{{/.test(params)) return _;
                const page: string = 'templates/' + title.trim().replace(/ /g, '_');

                // Retrieve template content
                let content: string = '';
                try {
                    content = fs.readFileSync('./' + page + '.wiki', { encoding: 'utf8' })
                }
                catch {
                    return `<a class="internal-link redlink" title="${title}" href="${page}">${title}</a>`;
                }

                // Substitite arguments
                const argMatch = (arg: string): RegExp => re(r`{{{ \s* ${arg} (?:\|([^}]*))? \s* }}}`);
                let args: string[] = params.split('|').slice(1);
                for (let i in args) {
                    let parts = args[i].split('=')
                    let [arg, val]: string[] = parts[1] ? [parts[0], ...parts.slice(1)] : [(+i + 1) + '', parts[0]];
                    content = content.replace(argMatch(arg), val || '$1');
                }
                for (let i = 1; i <= 10; i++) {
                    content = content.replace(argMatch(i + ''), '$1');
                }

                return content;
            })

            // Markup: '''bold''' and '''italic'''
            .replace(re(r`''' ([^']+?) '''`), '<b>$1</b>')
            .replace(re(r`''  ([^']+?)  ''`), '<i>$1</i>')

            // Headings: ==heading==
            .replace(re(r`^ (=+) (.+?) \1 \s* $`), (_, lvl, txt) => `<h${lvl.length}>${txt}</h${lvl.length}>`)

            // Internal links: [[Page]] and [[Page|Text]]
            .replace(re(r`\[\[ ([^\]|]+?) \]\]`), `<a class="internal-link" title="$1" href="/$1">$1</a>`)
            .replace(re(r`\[\[ ([^\]|]+?) \| ([^\]]+?) \]\]`), `<a class="internal-link" title="$1" href="/$1">$2</a>`)
            .replace(re(r`(</a>)([a-z]+)`), '$2$1')

            // External links: [href Page] and just [href]
            .replace(re(r`\[ ((?:\w+:)?\/\/ [^\s\]]+) (\s [^\]]+?)? \]`), (_, href, txt) => `<a class="external-link" href="${href}">${txt || '[' + (++rawExtLinkCount) + ']'}</a>`)

            // Bulleted list: *item
            .replace(re(r`^ (\*+) (.+?) $`, 'gm'), (_, lvl, txt) => `${'<ul>'.repeat(lvl.length)}<li>${txt}</li>${'</ul>'.repeat(lvl.length)}`)
            .replace(re(r`</ul> (\s*?) <ul>`), '$1')

            // Numbered list: #item
            .replace(re(r`^ (#+) (.+?) $`, 'gm'), (_, lvl, txt) => `${'<ol>'.repeat(lvl.length)}<li>${txt}</li>${'</ol>'.repeat(lvl.length)}`)
            .replace(re(r`</ol> (\s*?) <ol>`), '$1')

            // Definition list: ;head, :item
            .replace(re(r`^ ; (.+) $`, 'gm'), '<dl><dt>$1</dt></dl>')
            .replace(re(r`^ (:+) (.+?) $`, 'gm'), (_, lvl, txt) => `${'<dl>'.repeat(lvl.length)}<dd>${txt}</dd>${'</dl>'.repeat(lvl.length)}`)
            .replace(re(r`</dl> (\s*?) <dl>`), '$1')

            // References: <ref></ref>, <references/>
            .replace(re(r`<ref> (.+?) </ref>`), (_, text) => {
                refs.push(text);
                refCount++;
                return `<sup><a id="cite-${refCount}" class="ref" href="#ref-${refCount}">[${refCount}]</a></sup>`
            })
            .replace(re(r`<references \s* /?>`), '<ol>' + refs.map((ref, i) =>
                `<li id="ref-${+i + 1}"> <a href="#cite-${+i + 1}">↑</a> ${ref} </li>`).join('\n') + '</ol>'
            )

            // Nonstandard: ``code`` and ```code blocks```
            .replace(re(r` \`\`\` ([^\`]+?) \`\`\` `), '<pre>$1</pre>')
            .replace(re(r` \`\` ([^\`]+?) \`\` `), '<code>$1</code>')

            // Spacing
            .replace(/(\r?\n){2}/g, '\n</p><p>\n')

    }
    return outText;
}
