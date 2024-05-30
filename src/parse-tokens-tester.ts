import { parse } from './parse-tokens';

console.log(parse(`

<ref>data</ref>
<ref group=note>note</ref>
<ref name=":0">Content</ref>
<ref name=":0"></ref>

==refs==
<references/>
<references group=note/>

`).data)
