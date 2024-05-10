export default String.raw`
body {font-family: sans-serif; margin: 4em; max-width: 1000px; background: #eee;}
main {margin: 3em -1em; background: #fff; padding: 1em;}
h1, h2 {margin-bottom: 0.6em; font-weight: normal; border-bottom: 1px solid #a2a9b1;}
ul, ol {margin: 0.3em 0 0 1.6em; padding: 0;}
dt {font-weight: bold;}
dd, dl dl {margin-block: 0; margin-inline-start: 30px;}

figure {margin: 1em;}
.image-thumb, .image-frame {padding: 6px; border: 1px solid gray;}
.image-default {margin: 0;}
figcaption {padding-top: 6px;}

table.wikitable {border-collapse: collapse;}
table.wikitable, table.wikitable th, table.wikitable td {border: 1px solid gray; padding: 6px;}
table.wikitable th {background-color: #eaecf0; text-align: center;}

a:not(:hover) {text-decoration: none;}
a.internal-link {color: #04a;}
a.internal-link:visited {color: #26d;}
a.external-link {color: #36b;}
a.external-link:visited {color: #58d;}
a.external-link::after {content: '\1f855';}
a.redlink {color: #d33;}
a.redlink:visited {color: #b44;}

#page+toc {border: 1px solid #aab; padding: 8px; width: fit-content; background-color: #f8f8f8; font-size: 95%;}
#page+toc-heading {display: block; text-align: center;}
#page+toc ol {margin: 0 0 0 1.3em;}
`
