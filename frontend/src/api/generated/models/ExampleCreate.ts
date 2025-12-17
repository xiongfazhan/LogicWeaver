/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for creating an Example.
 */
export type ExampleCreate = {
    content: string;
    content_type?: ('image' | 'text' | null);
    label: ExampleCreate.label;
    description?: (string | null);
};
export namespace ExampleCreate {
    export enum label {
        PASS = 'PASS',
        FAIL = 'FAIL',
    }
}

