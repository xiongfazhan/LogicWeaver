/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExampleCreate } from '../models/ExampleCreate';
import type { ExampleResponse } from '../models/ExampleResponse';
import type { ExampleUpdate } from '../models/ExampleUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ExamplesService {
    /**
     * List Examples
     * List all examples for a step.
     *
     * - **step_id**: UUID of the step
     * - **label**: Optional filter by label (PASS or FAIL)
     * @param stepId
     * @param label Filter by label (PASS or FAIL)
     * @returns ExampleResponse Successful Response
     * @throws ApiError
     */
    public static listExamplesApiStepsStepIdExamplesGet(
        stepId: string,
        label?: (string | null),
    ): CancelablePromise<Array<ExampleResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/steps/{step_id}/examples',
            path: {
                'step_id': stepId,
            },
            query: {
                'label': label,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Example
     * Create a new example for a step.
     *
     * - **step_id**: UUID of the step
     * - **content**: Example content (URL for image, text for text)
     * - **content_type**: Content type ('image' or 'text')
     * - **label**: Label ('PASS' or 'FAIL') - determines which upload zone
     * - **description**: Optional description
     *
     * Note: The label determines whether this is a passing or failing example.
     * Examples uploaded to the passing zone should have label='PASS',
     * and examples uploaded to the failing zone should have label='FAIL'.
     * @param stepId
     * @param requestBody
     * @returns ExampleResponse Successful Response
     * @throws ApiError
     */
    public static createExampleApiStepsStepIdExamplesPost(
        stepId: string,
        requestBody: ExampleCreate,
    ): CancelablePromise<ExampleResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/steps/{step_id}/examples',
            path: {
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
     * Get Example
     * Get an example by ID.
     *
     * - **example_id**: UUID of the example
     * @param exampleId
     * @returns ExampleResponse Successful Response
     * @throws ApiError
     */
    public static getExampleApiExamplesExampleIdGet(
        exampleId: string,
    ): CancelablePromise<ExampleResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/examples/{example_id}',
            path: {
                'example_id': exampleId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Example
     * Update an example.
     *
     * - **example_id**: UUID of the example
     * - All fields are optional for partial updates
     * @param exampleId
     * @param requestBody
     * @returns ExampleResponse Successful Response
     * @throws ApiError
     */
    public static updateExampleApiExamplesExampleIdPut(
        exampleId: string,
        requestBody: ExampleUpdate,
    ): CancelablePromise<ExampleResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/examples/{example_id}',
            path: {
                'example_id': exampleId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Example
     * Delete an example.
     *
     * - **example_id**: UUID of the example
     * @param exampleId
     * @returns void
     * @throws ApiError
     */
    public static deleteExampleApiExamplesExampleIdDelete(
        exampleId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/examples/{example_id}',
            path: {
                'example_id': exampleId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
