export declare class ValidationError extends Error {
    location: Location;
    cause: string;
    constructor(cause: string, description: string, index?: string | number, location?: Location);
}
declare type Location = Array<{
    description: string;
    index: string | number | undefined;
}>;
export declare function rethrowValidationError(error: ValidationError, description: string, index: string | number | undefined): never;
export {};
