# Changelog

## Next
- Added support for video embeds: currently only supports `{{#ev:youtube}}` and `{{#ev:vimeo}}`.
- Changed images to be displayed inline by default when no float is given.
- Fixed unused parameters being substituted with random numbers instead of their default values.
- Fixed files and links becoming broken when parameters are inside them.
- Fixed lists not outputting properly when a parser function is used on the line.
- Fixed images being erroneously parsed as regular links.
- Fixed internal links.

## 1.3.3
*2024-05-08*
- Fixed characters around elements being erroneously padded with spaces.
- Fixed inline definition lists not being parsed.
- Fixed equal signs in named template arguments creating broken output.
- Fixed piped links in template arguments creating broken output.

## 1.3.2
*2024-05-08*
- Fixed `nowiki` content not being fully unparsed.
- Fixed output files not having the correct path to the default stylesheet.
- Fixed URLs in output files being absolute.
- Fixed various issues with incorrect outputted file names.
- Fixed `||` not being treated as valid table cell syntax.
- Fixed front matter being generated even when config option `eleventy` was set to `false`.
- Fixed defaults not being used when `compile` called from CLI.
- Unmarked Eleventy as a peer dependency.

## 1.3.1
*2024-05-03*
- Allowed support for Eleventy >1.0.0.
- Fixed crash occurring when compiling images with no parameters.
- Fixed default template arguments not being parsed.
- Fixed output description metadata property being malformed.

## 1.3.0
*2021-05-16*
- Added configuration option `imagesFolder` to configure the folder that images are placed in.
- Added support for images using the `[[File:Image.png|options|caption]]` syntax.
- Added `class="wikitable"` table styling.
- Fixed a crash occurring when the templates folder did not exist when compiling.

## 1.2.1
*2021-04-02*
- Added previously-unimplemented `config` option to `parse()` to configure the `templatesFolder`.
- Changed table of contents to not require default styling to collapse.
- Fixed internal links being incorrectly root-relative.
- Fixed templates output folder not being created on initialisation.
- Fixed unset arguments not being removed from the output.

## 1.2.0
*2021-04-01*
- Added function `eleventyPlugin()` for use with Eleventy's `addPlugin` method.
- Added configuration option `outputFolder` to configure the folder the compiled HTML files are placed in.
- Added configuration option `templatesFolder` to configure the folder templates are placed in.
- Added CLI options `--outputFolder`, `--templatesFolder`, `--eleventy`, and `--defaultStyles` to change configuration options.
- Added support for tables.
- Added a warning when the parser detects non-repetition-based `#time` function syntax is being used.

## 1.1.0
*2021-03-28*
- Added `parse` CLI command to implement `parse()`.
- Added a generated table of contents if there are over 4 headings.
- Added support for `nowiki` tag.
- Added support for `onlyinclude`, `includeonly`, and `noinclude` tags in templates.
- Added support for magic words `__TOC__`, `__FORCETOC__`, `__NOTOC__`, and `__NOINDEX__`.
- Added support for control function `{{displaytitle:}}` to control the page's displayed title.
- Added support for string functions `lc:`, `uc:`, `lcfirst:`, `ucfirst:`, `replace:`, `explode:`, `sub:`, `len:`, `pos:`, `padleft:`, `padright:`, `urlencode:`, and `urldecode:`.
- Added support for horizontal rules using `----`.
- Changed time codes in `#datetime`/`#date`/`#time` function to be based on reduplication instead of unique characters with escaping based on quoting instead of prefixing with a backslash (i.e., `{{#time: j F Y (\n\o\w)}}` &rarr; `{{#time: dd mmm yyyy "(now)"}}`).
- Fixed inline tags removing whitespace from either end.
- Fixed single-line-only syntax not being parsed correctly.

## 1.0.1
*2021-03-28*
- Changed HTML output to be prettified.
- Fixed arguments not being substituted properly.
- Fixed nested templates and parser functions not being substituted properly.
- Fixed templates and parser functions spread out across multiple lines not being parsed.

## 1.0.0
*2021-03-27*
- Added `compile()` function and CLI command to compile wikitext into HTML.
- Added `parse()` function to parse raw wikitext input.
