export declare type Metadata = Record<string, any>;
export declare type Config = {
    eleventy?: boolean;
    defaultStyles?: boolean;
    customStyles?: string;
};
export declare class Result extends String {
    metadata: Metadata;
    constructor(str: string);
}
