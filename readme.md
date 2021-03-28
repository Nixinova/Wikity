# Wikity

**Wikity** is a tool that allows you to use Wikitext (used by Wikipedia, Fandom, etc) as a templating language to create HTML pages, useful in build tools such as [Eleventy](https://11ty.dev).

## Install

Wikity is available [on npm](https://www.npmjs.com/package/wikity).

| Local install        | Global install          |
| -------------------- | ----------------------- |
| `npm install wikity` | `npm install -g wikity` |

## API

- `wikity.compile(directory?: string, options?: object)`
  - Compile Wikitext files into HTML. Find outputted files in folder `wikity-out/`.
  - `directory?: string`
    - The folder to compile (default: `.`, the current directory).
  - `options?: object`
    - `eleventy?: boolean`
      - Whether [front matter](https://www.11ty.dev/docs/data-frontmatter/) will be added to the outputted HTML for Eleventy to read (default: `false`).
    - `defaultStyles?: boolean`
      - Whether to use default wiki styling (default: `true`).
    - `customStyles?: string`
      - Custom CSS to style the wiki pages (default: `''`).
- `wikity.clean()`
  - Clean up residual folders after compilation.

Calling `wikity()` will compile all `.wiki` files into their corresponding `.html` versions.
Outputted files are located in the `wikity-out/` directory.

```js
const wikity = require('wikity');
wikity.compile(); // compile all .wiki files inside this directory
```

Use Wikity along with Eleventy to compile your wiki files during the build process:

```js
// .eleventy.js (eleventy's configuration file)
const wikity = require('wikity');
wikity.compile('.', { eleventy: true });
```

## Usage

Use [Wikitext](https://en.wikipedia.org/wiki/Help:Wikitext) (file extension `.wiki`) to create your pages.

Any wiki templates (called using `{{template name}}`) must be inside the `templates/` folder.

### Wiki markup

| Markup                           | Preview                                   |
| -------------------------------- | ----------------------------------------- |
| `'''bold'''`                     | **bold**                                  |
| `''italic''`                     | *italic*                                  |
| `'''''bold italic'''''`          | ***bold italic***                         |
| ` ``code`` `                     | `code`                                    |
| ` ```code block``` `             | <pre>code block</pre>                     |
| `=heading=`                      | <big><big><big>heading</big></big></big>  |
| `==subheading==`                 | <big><big>subheading</big></big>          |
| `*bulleted`                      | <ul><li>bulleted</li></ul>                |
| `**sub-bulleted`                 | <ul><ul><li>sub-bulleted</li></ul></ul>   |
| `#numbered`                      | <ol><li>numbered</li></ol>                |
| `##sub-numbered`                 | <ol><ol><li>sub-numbered</li></ol></ol>   |
| `;term`                          | <dt>**term**</dt>                         |
| `:definition`                    | <dd>&emsp;definition</dd>                 |
| `<ref>Text</ref>`                | <sup id=cite-1>[[1]](#ref-1)</sup>        |
| `<references/>`                  | 1. <a id=ref-1>[↑](#cite-1)</a> Text      |
| `[[internal link]]`              | [internal link](#internal_link)           |
| `[[link\|display text]]`         | [display text](#link)                     |
| `[external-link]`                | [[1]](#external-link)                     |
| `[external-link display text]`   | [display text](#external-link)            |
| `{{tp name}}`                    | *(contents of `templates/tp_name.wiki`)*  |
| `{{tp name\|arg=val}}`           | *(ditto but `{{{arg}}}` is set to 'val')* |
| `{{{arg}}}`                      | *(value given by template)*               |
| `{{{arg\|default val}}}`         | *(ditto but 'default val' if unset)*      |
| `{{#if:non-empty-string\|text}}` | text                                      |
| `{{#ifeq:1\|2\|true\|false}}`    | false                                     |
| `{{#vardefine:varname\|text}}`   | *(saved to memory)*                       |
| `{{#var:varname}}`               | text *(from memory)*                      |
| `{{#var:varname\|default val}}`  | *(ditto but 'default val' if unset)*      |
| `{{#switch:a\|a=1\|b=2\|c=3}}`   | 1                                         |
| `{{#time:dd/mm/yy\|2021-03-28}}` | 28/03/21                                  |
| `{{lc:TEXT}}`                    | text                                      |
| `{{ucfirst:text}}`               | Text                                      |
| `{{len:12345}}`                  | 5                                         |
| `{{sub:string|2|4}}`             | ring                                      |
| `{{pos:text|x}}`                 | 2                                         |
| `{{padleft:text|5|_}}`           | _text                                     |
| `{{padright:msg|5|_}}`           | msg__                                     |
| `{{replace:Message|e|3}}`        | M3ssag3                                   |
| `{{explode:A-B-C-D|-|2}}`        | C                                         |
| `{{urlencode:t e x t}}`          | t%20e%20x%20t                             |
| `{{urldecode:a%20b%27c}}`        | a b'c                                     |
| `<noinclude>No</noinclude>`      | *(blank outside a template)*              |
| `<onlyinclude>Yes</onlyinclude>` | Yes                                       |
| `<includeonly>Yes</includeonly>` | Yes *(blank inside a template)*           |
| `<nowiki>[[no link]]</nowiki>`   | [[no link]]                               |
