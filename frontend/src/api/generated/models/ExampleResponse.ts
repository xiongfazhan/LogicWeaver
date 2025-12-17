/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for Example response.
 */
export type ExampleResponse = {
    content: string;
    content_type?: ('image' | 'text' | null);
    label: ExampleResponse.label;
    description?: (string | null);
    id: string;
    step_id: string;
    created_at: string;
};
export namespace ExampleResponse {
    export enum label {
        PASS = 'PASS',
        FAIL = 'FAIL',
    }
}

