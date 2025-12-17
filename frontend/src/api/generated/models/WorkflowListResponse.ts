/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkflowSummary } from './WorkflowSummary';
/**
 * Schema for paginated workflow list response.
 */
export type WorkflowListResponse = {
    items: Array<WorkflowSummary>;
    total: number;
    page: number;
    page_size: number;
};

