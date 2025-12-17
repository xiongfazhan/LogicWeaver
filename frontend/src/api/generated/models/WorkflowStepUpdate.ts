/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for updating a WorkflowStep.
 */
export type WorkflowStepUpdate = {
    name?: (string | null);
    step_order?: (number | null);
    status?: ('pending' | 'completed' | null);
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

