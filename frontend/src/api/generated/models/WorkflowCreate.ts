/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for creating a Workflow.
 */
export type WorkflowCreate = {
    name: string;
    description?: (string | null);
    cover_image_url?: (string | null);
    status?: WorkflowCreate.status;
};
export namespace WorkflowCreate {
    export enum status {
        DRAFT = 'draft',
        DEPLOYED = 'deployed',
    }
}

