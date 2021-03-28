export type Metadata = Record<string, any>;

export type Config = {
    eleventy?: boolean,
    defaultStyles?: boolean,
    customStyles?: string,
}

export class Result extends String {
    public metadata: Metadata;
    constructor(str: string) {
        super(str);
        this.metadata = {};
    }
}
