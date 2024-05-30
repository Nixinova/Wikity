import { parse } from './parse-tokens';

console.log(parse(`

<div style="border:1px solid">
= List =
* Bulleted list
* Bulleted list item 2
** Sub-item
*** Indented
* Root item
# Numbered list
# Numbered list item 2
## Sub-item
### Indented
# Root item
;Pseudoheader
: Root indent
:: Subindent
::: Indented
</div>
`).data)
