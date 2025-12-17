/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProtocolWorkflow } from '../models/ProtocolWorkflow';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProtocolService {
    /**
     * Generate Protocol JSON
     * Generate Protocol JSON from a workflow for Agent engine consumption.
     * @param workflowId
     * @returns ProtocolWorkflow Successful Response
     * @throws ApiError
     */
    public static getProtocolApiProtocolWorkflowIdGet(
        workflowId: string,
    ): CancelablePromise<ProtocolWorkflow> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/protocol/{workflow_id}',
            path: {
                'workflow_id': workflowId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
