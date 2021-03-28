# Changelog

## 1.1.0
*2021-03-28*
- Added `parse` CLI command to implement `parse()`.
- Added support for a table of contents.
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
