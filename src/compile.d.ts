declare type Config = {
    eleventy?: boolean;
    defaultStyles?: boolean;
    customStyles?: string;
};
export declare function compile(dir?: string, config?: Config): void;
export {};
