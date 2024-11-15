# Changelog

## 1.3.6
*2024-11-14*
- Changed TOC generation to only include wikitext headings.
- Fixed TOC being misplaced when non-wikitext headings are on the page.
- Fixed TOC styling.
- Fixed spacing issues in output such as in metadata and cite notes.
- Fixed layout issues with non-`thumb` images.

## 1.3.5
*2024-05-12*
- Changed output to no longer be prettified.
- Fixed spacing issues resulting from output prettification.
- Fixed a crash occurring when invalid dates are given to `#time`.
- Fixed links in image captions breaking the output.
- Fixed underscores appearing in the default page title when present in the URL.
- Fixed links not being automatically capitalised.
- Fixed named references not working.
- Fixed template calls inside table cells breaking the table.
- Fixed headings not working when containing formatting.
- Fixed all index numbers in the TOC being '1'.
- Fixed images being deformed to 300x300px by default.

## 1.3.4
*2024-05-18*
- Added support for video embeds: currently only supports `{{#ev:youtube}}` and `{{#ev:vimeo}}`.
- Added support for named references.
- Added styling for infoboxes (`#infobox`).
- Changed images to be displayed inline by default when no float is given.
- Fixed a crash occurring when attempting to apply custom styles.
- Fixed a crash occurring when a template goes unparsed.
- Fixed unused parameters being substituted with random numbers instead of their default values.
- Fixed templates not being trimmed before being substituted.
- Fixed lists not outputting properly when a parser function is used on the line.
- Fixed tables not allowing attributes syntax.
- Fixed files and links becoming broken when parameters are inside them.
- Fixed images being erroneously parsed as regular links.
- Fixed internal links sometimes having wrong targets.
- Fixed the TOC being inline in the default styles.
- Fixed CSS selector for TOC heading not being specific enough.

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
