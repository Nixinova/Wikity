[![Latest version](https://img.shields.io/github/v/release/Nixinova/Wikity?label=latest%20version&style=flat-square)](https://github.com/Nixinova/Wikity/releases)
[![Last updated](https://img.shields.io/github/release-date/Nixinova/Wikity?label=updated&style=flat-square)](https://github.com/Nixinova/Wikity/releases)
[![npm downloads](https://img.shields.io/npm/dt/wikity?logo=npm)](https://www.npmjs.com/package/wikity)

# Wikity

**Wikity** is a tool that allows you to use Wikitext (used by Wikipedia, Fandom, etc) as a templating language to create HTML pages.

This package comes with built-in support for compilation using [Eleventy](https://11ty.dev).

## Exemplar

See the `example` folder for a template on making your own wiki site!

## Install

Wikity is available [on npm](https://www.npmjs.com/package/wikity).
Install locally to use in a Node package or install globally for use from the command-line.

| Local install        | Global install          |
| -------------------- | ----------------------- |
| `npm install wikity` | `npm install -g wikity` |

## API

### Node

- `wikity.compile(folder?: string, options?: object): void`
  - Compile all Wikitext (`.wiki`) files from an input folder (defaults to the current directory, `.`) into HTML.
- `wikity.parse(input: string, options?: object): string`
  - Parse raw wikitext input into HTML.

- **Options**:
  - `eleventy: boolean = false`
    - Whether [front matter](https://www.11ty.dev/docs/data-frontmatter/) will be added to the outputted HTML for Eleventy to read (default: `false`).
      (**This parameter *must* be set to `true` if you want to use this with Eleventy.**)
  - `outputFolder: string`
    - *Used only with `compile()`.*
    - Where outputted HTML files shall be placed.
    - Default: `'wikity-out'`.
  - `templatesFolder: string`
    - What folder to place templates in.
    - Default: `'templates'`.
  - `imagesFolder: string`
    - What folder to place images in.
    - Default: `'images'`.
  - `defaultStyles: boolean`
    - *Used only with `compile()`.*
    - Whether to use default wiki styling.
    - Default: to `true` when called from `compile()` and `false` when called from `parse()`.
  - `customStyles: string`
    - *Used only with `compile()`.*
    - Custom CSS styles to add to the wiki pages.
    - Default: empty (`''`).

#### Example

```js
const wikity = require('wikity');

// compile all .wiki files inside this directory
wikity.compile();

// parse wikitext from an input string
let html = wikity.parse(`'''bold''' [[link|text]]`); // <b>bold</b> <a href="link"...>text</a>
```

#### As an Eleventy plugin

Use Wikity along with Eleventy to have all your wiki files compiled during the build process:

```js
// .eleventy.js (eleventy's configuration file)
const wikity = require('wikity');
module.exports = function (eleventyConfig) {
    const rootFolder = 'src';
    const templatesFolder = 'templates', imagesFolder = 'images'; // defaults; relative to root folder
    const outputFolder = 'wikity-out'; // default
    const wikityOptions = { eleventy: true, templatesFolder, imagesFolder, outputFolder };
    const wikityPlugin = () => wikity.compile(rootFolder, wikityOptions);
    eleventyConfig.addPlugin(wikityPlugin);
    eleventyConfig.addPassthroughCopy({ 'src/images': 'wiki/' + imagesFolder }); // Eleventy does not pass through images by default
}
```

The above will use the following file structure (with some example wiki files given):

- `src/`
  - `templates/`: Directory for wiki templates (called like `{{this}}`)
  - `images/`: Directory to place images (called like `[[File:this]]`)
  - `Index.wiki`: Example file
  - `Other_Page.wiki`: Example other file
- `wikity-out/`: File templates compiled from the `.wiki` files (add this to `.gitignore`)
- `wiki/`: Output HTML files compiled from `wikity-out/` (add this to `.gitignore`)

(View the above starting at the URL path `/wiki/` when ran in an HTTP server.)

### Command-line
```cmd
$ wikity help
Display a help message
$ wikity compile [<folder>] [-o <folder>] [-t <folder>] [-e] [-d]
Compile Wikity with various options
$ wikity parse <input>
Parse raw input into HTML
$ wikity version
Display the latest version of Wikity
```

## Usage

Use [Wikitext](https://en.wikipedia.org/wiki/Help:Wikitext) (file extension `.wiki`) to create your pages.

Any wiki templates (called using `{{template name}}`) must be inside the `templates/` folder by default.
Any files must be inside the `images/` folder by default.
Your wikitext (`*.wiki`) files go in the root directory by default.

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
| `[[File:Example.png\|Caption.]]` | ![Caption](Example.png)                   |
| `{{tp name}}`                    | *(contents of `templates/tp_name.wiki`)*  |
| `{{tp name\|arg=val}}`           | *(ditto but `{{{arg}}}` is set to 'val')* |
| `{{{arg}}}`                      | *(value given by template)*               |
| `{{{arg\|default val}}}`         | *(ditto but 'default val' if unset)*      |
| `{\| style="margin:1em"`         | *table opening*                           |
| `! Cell heading`                 | **Cell heading**                          |
| `\|- class="new-row"`            | *new table row*                           |
| `\| Cell content`                | Cell content                              |
| `\|}`                            | *table closing*                           |
| `{{#if:non-empty-string\|text}}` | text                                      |
| `{{#ifeq:1\|2\|true\|false}}`    | false                                     |
| `{{#vardefine:varname\|text}}`   | *(saved to memory)*                       |
| `{{#var:varname}}`               | text *(from memory)*                      |
| `{{#var:varname\|default val}}`  | *(ditto but 'default val' if unset)*      |
| `{{#switch:a\|a=1\|b=2\|c=3}}`   | 1                                         |
| `{{#time:dd/mm/yy\|2021-03-28}}` | 28/03/21                                  |
| `{{#lc:TEXT}}`                   | text                                      |
| `{{#ucfirst:text}}`              | Text                                      |
| `{{#len:12345}}`                 | 5                                         |
| `{{#sub:string\|2\|4}}`          | ring                                      |
| `{{#pos:text\|x}}`               | 2                                         |
| `{{#padleft:text\|5\|_}}`        | _text                                     |
| `{{#padright:msg\|5\|_}}`        | msg__                                     |
| `{{#replace:Message\|e\|3}}`     | M3ssag3                                   |
| `{{#explode:A-B-C-D\|-\|2}}`     | C                                         |
| `{{#urlencode:t e x t}}`         | t%20e%20x%20t                             |
| `{{#urldecode:a%20b%27c}}`       | a b'c                                     |
| `{{#ev:youtube\|dQw4w9WgXcQ}}`   | *(YouTube embed)*                         |
| `<noinclude>No</noinclude>`      | *(blank outside a template)*              |
| `<onlyinclude>Yes</onlyinclude>` | Yes                                       |
| `<includeonly>Yes</includeonly>` | Yes *(blank inside a template)*           |
| `<nowiki>[[no link]]</nowiki>`   | [[no link]]                               |
