import { parse } from './parse-tokens';

console.log(parse(`

{{#titleparts: Talk:Foo/bar/baz/quok }} → Talk:Foo/bar/baz/quok
{{#titleparts: Talk:Foo/bar/baz/quok | 1 }} → Talk:Foo
{{#titleparts: Talk:Foo/bar/baz/quok | -1 }} → Talk:Foo/bar/baz
{{#titleparts: Talk:Foo/bar/baz/quok | -4 }} → .

`).data)
