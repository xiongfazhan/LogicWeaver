/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RoutingBranchCreate } from '../models/RoutingBranchCreate';
import type { WorkflowStepCreate } from '../models/WorkflowStepCreate';
import type { WorkflowStepResponse } from '../models/WorkflowStepResponse';
import type { WorkflowStepUpdate } from '../models/WorkflowStepUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StepsService {
    /**
     * List Steps
     * List all steps for a workflow.
     *
     * - **workflow_id**: UUID of the workflow
     * - **page**: Page number (default: 1)
     * - **page_size**: Number of items per page (default: 100, max: 100)
     * @param workflowId
     * @param page Page number
     * @param pageSize Items per page
     * @returns WorkflowStepResponse Successful Response
     * @throws ApiError
     */
    public static listStepsApiWorkflowsWorkflowIdStepsGet(
        workflowId: string,
        page: number = 1,
        pageSize: number = 100,
    ): CancelablePromise<Array<WorkflowStepResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workflows/{workflow_id}/steps',
            path: {
                'workflow_id': workflowId,
            },
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
     * Create Step
     * Create a new step in a workflow.
     *
     * - **workflow_id**: UUID of the workflow
     * - **auto_order**: If true, automatically assign step_order (append to end)
     * - **name**: Step name (required)
     * - **step_order**: Step order (required if auto_order is false)
     * - **status**: Step status, 'pending' or 'completed' (default: 'pending')
     * @param workflowId
     * @param requestBody
     * @param autoOrder Auto-assign step order (append to end)
     * @returns WorkflowStepResponse Successful Response
     * @throws ApiError
     */
    public static createStepApiWorkflowsWorkflowIdStepsPost(
        workflowId: string,
        requestBody: WorkflowStepCreate,
        autoOrder: boolean = false,
    ): CancelablePromise<WorkflowStepResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/workflows/{workflow_id}/steps',
            path: {
                'workflow_id': workflowId,
            },
            query: {
                'auto_order': autoOrder,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Step
     * Get a step by ID.
     *
     * - **workflow_id**: UUID of the workflow
     * - **step_id**: UUID of the step
     * @param workflowId
     * @param stepId
     * @returns WorkflowStepResponse Successful Response
     * @throws ApiError
     */
    public static getStepApiWorkflowsWorkflowIdStepsStepIdGet(
        workflowId: string,
        stepId: string,
    ): CancelablePromise<WorkflowStepResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workflows/{workflow_id}/steps/{step_id}',
            path: {
                'workflow_id': workflowId,
                'step_id': stepId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Step
     * Update a step.
     *
     * - **workflow_id**: UUID of the workflow
     * - **step_id**: UUID of the step
     * - All fields are optional for partial updates
     * @param workflowId
     * @param stepId
     * @param requestBody
     * @returns WorkflowStepResponse Successful Response
     * @throws ApiError
     */
    public static updateStepApiWorkflowsWorkflowIdStepsStepIdPut(
        workflowId: string,
        stepId: string,
        requestBody: WorkflowStepUpdate,
    ): CancelablePromise<WorkflowStepResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/workflows/{workflow_id}/steps/{step_id}',
            path: {
                'workflow_id': workflowId,
                'step_id': stepId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Step
     * Delete a step.
     *
     * - **workflow_id**: UUID of the workflow
     * - **step_id**: UUID of the step
     *
     * Note: Remaining steps will be automatically reordered.
     * @param workflowId
     * @param stepId
     * @returns void
     * @throws ApiError
     */
    public static deleteStepApiWorkflowsWorkflowIdStepsStepIdDelete(
        workflowId: string,
        stepId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/workflows/{workflow_id}/steps/{step_id}',
            path: {
                'workflow_id': workflowId,
                'step_id': stepId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Add Routing Branch
     * Add a routing branch to a step.
     *
     * - **workflow_id**: UUID of the workflow
     * - **step_id**: UUID of the step
     * - **condition_result**: Condition result (e.g., 'FAIL', 'UNSTABLE')
     * - **action_type**: Action type (e.g., 'REJECT', 'ESCALATE')
     * - **next_step_id**: Next step ID or 'end_process'
     * @param workflowId
     * @param stepId
     * @param requestBody
     * @returns WorkflowStepResponse Successful Response
     * @throws ApiError
     */
    public static addRoutingBranchApiWorkflowsWorkflowIdStepsStepIdBranchesPost(
        workflowId: string,
        stepId: string,
        requestBody: RoutingBranchCreate,
    ): CancelablePromise<WorkflowStepResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/workflows/{workflow_id}/steps/{step_id}/branches',
            path: {
                'workflow_id': workflowId,
                'step_id': stepId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Remove Routing Branch
     * Remove a routing branch from a step.
     *
     * - **workflow_id**: UUID of the workflow
     * - **step_id**: UUID of the step
     * - **branch_id**: UUID of the branch to remove
     * @param workflowId
     * @param stepId
     * @param branchId
     * @returns WorkflowStepResponse Successful Response
     * @throws ApiError
     */
    public static removeRoutingBranchApiWorkflowsWorkflowIdStepsStepIdBranchesBranchIdDelete(
        workflowId: string,
        stepId: string,
        branchId: string,
    ): CancelablePromise<WorkflowStepResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/workflows/{workflow_id}/steps/{step_id}/branches/{branch_id}',
            path: {
                'workflow_id': workflowId,
                'step_id': stepId,
                'branch_id': branchId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
