export default function dedent(string: string) {
    const indent = string.match(/^[ \t]*(?=\S)/m)?.[0] ?? '';
    return string
        // dedent
        .replace(new RegExp(`^${indent}`, 'gm'), '')
        // trim
        .replace(/^\s*\n|\n\s*$/g, '')
}
