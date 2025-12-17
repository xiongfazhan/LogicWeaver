/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkflowCreate } from '../models/WorkflowCreate';
import type { WorkflowListResponse } from '../models/WorkflowListResponse';
import type { WorkflowResponse } from '../models/WorkflowResponse';
import type { WorkflowUpdate } from '../models/WorkflowUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WorkflowsService {
    /**
     * List Workflows
     * List all workflows with pagination.
     *
     * - **page**: Page number (default: 1)
     * - **page_size**: Number of items per page (default: 20, max: 100)
     * @param page Page number
     * @param pageSize Items per page
     * @returns WorkflowListResponse Successful Response
     * @throws ApiError
     */
    public static listWorkflowsApiWorkflowsGet(
        page: number = 1,
        pageSize: number = 20,
    ): CancelablePromise<WorkflowListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workflows',
            query: {
                'page': page,
                'page_size': pageSize,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Workflow
     * Create a new workflow.
     *
     * - **name**: Workflow name (required)
     * - **description**: Workflow description (optional)
     * - **cover_image_url**: Cover image URL (optional)
     * - **status**: Workflow status, 'draft' or 'deployed' (default: 'draft')
     * @param requestBody
     * @returns WorkflowResponse Successful Response
     * @throws ApiError
     */
    public static createWorkflowApiWorkflowsPost(
        requestBody: WorkflowCreate,
    ): CancelablePromise<WorkflowResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/workflows',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Workflow
     * Get a workflow by ID.
     *
     * - **workflow_id**: UUID of the workflow
     * @param workflowId
     * @returns WorkflowResponse Successful Response
     * @throws ApiError
     */
    public static getWorkflowApiWorkflowsWorkflowIdGet(
        workflowId: string,
    ): CancelablePromise<WorkflowResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workflows/{workflow_id}',
            path: {
                'workflow_id': workflowId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Workflow
     * Update a workflow.
     *
     * - **workflow_id**: UUID of the workflow
     * - **name**: New workflow name (optional)
     * - **description**: New description (optional)
     * - **cover_image_url**: New cover image URL (optional)
     * - **status**: New status (optional)
     * @param workflowId
     * @param requestBody
     * @returns WorkflowResponse Successful Response
     * @throws ApiError
     */
    public static updateWorkflowApiWorkflowsWorkflowIdPut(
        workflowId: string,
        requestBody: WorkflowUpdate,
    ): CancelablePromise<WorkflowResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/workflows/{workflow_id}',
            path: {
                'workflow_id': workflowId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Workflow
     * Delete a workflow.
     *
     * - **workflow_id**: UUID of the workflow
     * @param workflowId
     * @returns void
     * @throws ApiError
     */
    public static deleteWorkflowApiWorkflowsWorkflowIdDelete(
        workflowId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/workflows/{workflow_id}',
            path: {
                'workflow_id': workflowId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
