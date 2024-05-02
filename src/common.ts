export type Metadata = Record<string, any>;

export type Config = {
    /** The folder that Wikity's compiled HTML files are outputted to (defaults to 'wikity-out') */
    outputFolder?: string,
    /** The folder that wiki templates are to be stored in relative to the root folder */
    templatesFolder?: string,
    /** The folder that images are to be stored in relative to the root folder */
    imagesFolder?: string,
    /** Whether to be set up for Eleventy integration (defaults to false) */
    eleventy?: boolean,
    /** Whether to use default wiki styling (defaults to true) */
    defaultStyles?: boolean,
    /** Custom CSS styles to add to the wiki pages */
    customStyles?: string,
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
