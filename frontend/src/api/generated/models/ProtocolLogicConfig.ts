/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProtocolFewShotExample } from './ProtocolFewShotExample';
/**
 * Logic configuration for a protocol step.
 */
export type ProtocolLogicConfig = {
    logic_strategy: ProtocolLogicConfig.logic_strategy;
    rule_expression?: (string | null);
    few_shot_examples?: (Array<ProtocolFewShotExample> | null);
    evaluation_prompt?: (string | null);
};
export namespace ProtocolLogicConfig {
    export enum logic_strategy {
        RULE_BASED = 'RULE_BASED',
        SEMANTIC_SIMILARITY = 'SEMANTIC_SIMILARITY',
    }
}

