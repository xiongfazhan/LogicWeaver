/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkflowStepResponse } from './WorkflowStepResponse';
/**
 * Schema for Workflow response with steps.
 */
export type WorkflowResponse = {
    name: string;
    description?: (string | null);
    cover_image_url?: (string | null);
    status?: WorkflowResponse.status;
    id: string;
    created_at: string;
    updated_at: string;
    steps?: Array<WorkflowStepResponse>;
};
export namespace WorkflowResponse {
    export enum status {
        DRAFT = 'draft',
        DEPLOYED = 'deployed',
    }
}

