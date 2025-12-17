/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProtocolRoutingBranch } from './ProtocolRoutingBranch';
/**
 * Routing map for a protocol step.
 */
export type ProtocolRoutingMap = {
    default_next: string;
    branches?: Array<ProtocolRoutingBranch>;
};

