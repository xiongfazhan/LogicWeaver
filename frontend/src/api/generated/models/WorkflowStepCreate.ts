/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for creating a WorkflowStep.
 */
export type WorkflowStepCreate = {
    name: string;
    step_order: number;
    status?: WorkflowStepCreate.status;
    context_type?: ('image' | 'text' | 'voice' | null);
    context_image_url?: (string | null);
    context_text_content?: (string | null);
    context_voice_transcript?: (string | null);
    context_description?: (string | null);
    extraction_keywords?: (Array<string> | null);
    extraction_voice_transcript?: (string | null);
    logic_strategy?: ('rule_based' | 'few_shot' | null);
    logic_rule_expression?: (string | null);
    logic_evaluation_prompt?: (string | null);
    routing_default_next?: (string | null);
};
export namespace WorkflowStepCreate {
    export enum status {
        PENDING = 'pending',
        COMPLETED = 'completed',
    }
}

