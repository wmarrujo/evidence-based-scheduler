export declare class Task {
    identifier: string;
    name: string;
    description: string;
    dependencies: Array<string>;
    prediction: number;
    actual: number | undefined;
    constructor(identifier: string, name: string, prediction: number, description?: string, dependencies?: Array<string>, actual?: number | undefined);
    get velocity(): number | undefined;
}
