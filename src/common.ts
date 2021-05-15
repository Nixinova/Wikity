export type Metadata = Record<string, any>;

export type Config = {
    outputFolder?: string,
    eleventy?: boolean,
    defaultStyles?: boolean,
    customStyles?: string,
    templatesFolder?: string,
    imagesFolder?: string,
}

export class Result extends String {
    public metadata: Metadata;
    constructor(str: string) {
        super(str);
        this.metadata = {};
    }
}

export function RegExpBuilder(regex: string, flag: string = 'mgi') {
    return RegExp(regex.replace(/ /g, '').replace(/\|\|.+?\|\|/g, ''), flag);
}

export const VERSION = '1.3.0';
