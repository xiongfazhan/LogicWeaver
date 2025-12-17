/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProtocolInputSpec } from './ProtocolInputSpec';
import type { ProtocolLogicConfig } from './ProtocolLogicConfig';
import type { ProtocolOutputSchema } from './ProtocolOutputSchema';
import type { ProtocolRoutingMap } from './ProtocolRoutingMap';
/**
 * Complete protocol step definition.
 */
export type ProtocolStep = {
    step_id: string;
    step_name: string;
    business_domain: string;
    input_spec: ProtocolInputSpec;
    logic_config: ProtocolLogicConfig;
    routing_map: ProtocolRoutingMap;
    output_schema: ProtocolOutputSchema;
};

