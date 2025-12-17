/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Summary schema for Workflow (without nested steps).
 */
export type WorkflowSummary = {
    name: string;
    description?: (string | null);
    cover_image_url?: (string | null);
    status?: WorkflowSummary.status;
    id: string;
    created_at: string;
    updated_at: string;
};
export namespace WorkflowSummary {
    export enum status {
        DRAFT = 'draft',
        DEPLOYED = 'deployed',
    }
}

