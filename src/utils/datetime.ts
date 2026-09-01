
/**
 * Takes a unique-character pattern and converts it into a repeated-character pattern.
 * @example `j F y` -> `dd MMMM yyyy`
 * @see https://www.mediawiki.org/wiki/Help:Extension:ParserFunctions##time
 */
export function convertDateTimeSyntax(pattern: string): string {
    const unsupportedChars: string[] = [];

    const unsupported = (char: string, fallback: string) => {
        unsupportedChars.push(char)
        return fallback;
    }

    const parts = pattern.split('\''); // `a'b'c` -> [a, 'b', c]

    const parsableParts =
        parts.filter((_, i) => i % 2 === 0); // even indices

    const processedParts = parsableParts
        // join to process
        .join(',')
        // process
        .replaceAll('y', 'yy') // year - must be before all other 'y' replacements
        .replaceAll('Y', 'yyyy') // year
        .replaceAll('L', () => unsupported('L', '')) // 'is leap year'
        .replaceAll('o', () => unsupported('o', 'yyyy')) // ISO year
        .replaceAll('m', 'mm') // month - must be before all other 'M' replacements
        .replaceAll('n', 'm') // month
        .replaceAll('M', 'mmm') // month
        .replaceAll('F', 'mmmm') // month
        .replaceAll('d', 'dd') // day - must be before all other 'd' replacements
        .replaceAll('j', 'd') // day
        .replaceAll('D', 'ddd') // day
        .replaceAll('l', 'dddd') // day
        .replaceAll('W', 'W') // ISO week number
        .replaceAll('N', () => unsupported('N', '')) // ISO week day
        .replaceAll('w', () => unsupported('w', '')) // alternate week day
        .replaceAll('a', 'tt') // am/pm
        .replaceAll('A', 'TT') // AM/PM
        .replaceAll('h', 'hh') // hour - must be before all other 'h' replacements
        .replaceAll('g', 'h') // hour
        .replaceAll('H', 'HH') // hour - must be before all other 'H' replacements
        .replaceAll('G', 'H') // hour
        .replaceAll('i', 'MM') // minute
        .replaceAll('s', 'ss') // second
        .replaceAll('U', () => unsupported('U', '')) // unix timestamp
        .replaceAll('Z', () => unsupported('Z', '')) // timezone offset seconds - must be before all other 'Z' replacements
        .replaceAll('e', 'Z') // timezone ID
        .replaceAll('T', 'Z') // timezone abbr
        .replaceAll('I', () => unsupported('I', '')) // 'is DST'
        .replaceAll('o', 'o') // timezone offset like +1200
        .replaceAll('P', 'p') // timezone offset like +12:00
        .replaceAll('t', () => unsupported('t', '')) // days in month
        .replaceAll('c', 'yyyy-mm-dd\'T\'HH:MM:ssp') // ISO 8601
        .replaceAll('r', 'ddd, dd mmm yyyy HH:MM:ss o') // RFC 5322
        // resplit
        .split(',')

    const result = parts
        .map((_, i) => i % 2 === 0 ? processedParts[i] : parts[i])
        .join('\'')

    if (unsupportedChars.length) {
        console.warn('<Wikity> [WARN] The following datetime format characters are not yet supported: ' + unsupportedChars.join(','));
    }

    return result;
}
