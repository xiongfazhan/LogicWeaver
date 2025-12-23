/**
 * AI Analysis 相关的 React Query Hooks
 * 用于调用 LLM 分析步骤描述和材料，生成 Data Flow Specification
 */
import { useMutation } from '@tanstack/react-query';
import { OpenAPI } from '../api';

// ============================================================================
// Types - 数据契约
// ============================================================================

/** 数据字段定义 */
export interface DataField {
    name: string;           // 字段名（英文蛇形命名）
    type: string;           // 数据类型: string, int, float, bool, image, file 等
    description: string;    // 字段说明（中文）
    required: boolean;      // 是否必填
    example?: string | null; // 示例值
}

/** 步骤数据契约 */
export interface StepContract {
    step_id: number;                      // 步骤序号
    step_name: string;                    // 步骤名称（中文）
    business_intent: string;              // 业务意图（一句话）
    inputs: DataField[];                  // 输入：这一步需要什么
    outputs: DataField[];                 // 输出：这一步必须返回什么
    acceptance_criteria?: string | null;  // 验收标准
    notes?: string | null;                // 备注
}

/** AI 分析结果 */
export interface AnalysisResult {
    contract: StepContract;     // 本步骤的数据契约
    confidence_score: number;   // 分析置信度 (0-1)
}

/** API 响应 */
export interface AnalysisResponse {
    step_id: string;
    step_name: string;
    result: AnalysisResult;
    llm_model: string;
    has_materials: boolean;
}

/** LLM 服务状态 */
export interface LLMStatus {
    enabled: boolean;
    provider: string;
    model: string;
    api_base: string;
}

/** 分析请求参数 */
export interface AnalyzeStepParams {
    stepId: string;
    previousOutputs?: DataField[];  // 前序步骤的输出变量
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * 分析步骤的描述和材料（支持上下文感知）
 */
async function analyzeStepExamples(params: AnalyzeStepParams): Promise<AnalysisResponse> {
    const { stepId, previousOutputs } = params;

    const body = previousOutputs ? { previous_outputs: previousOutputs } : undefined;

    const response = await fetch(
        `${OpenAPI.BASE}/api/analysis/steps/${stepId}/analyze`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        }
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Analysis failed' }));
        throw new Error(error.detail || `Analysis failed: ${response.status}`);
    }

    return response.json();
}

/**
 * 获取 LLM 服务状态
 */
export async function getLLMStatus(): Promise<LLMStatus> {
    const response = await fetch(`${OpenAPI.BASE}/api/analysis/status`);

    if (!response.ok) {
        throw new Error('Failed to get LLM status');
    }

    return response.json();
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * 分析单个步骤的 Mutation Hook
 */
export function useAnalyzeStep() {
    return useMutation<AnalysisResponse, Error, AnalyzeStepParams>({
        mutationFn: analyzeStepExamples,
    });
}

/**
 * 批量分析多个步骤（带上下文感知）
 * 
 * 每一步分析完成后，将其输出作为下一步的上下文传递
 * 确保变量名在步骤之间保持一致
 */
export function useAnalyzeAllSteps() {
    return useMutation<AnalysisResponse[], Error, string[]>({
        mutationFn: async (stepIds: string[]) => {
            const results: AnalysisResponse[] = [];
            let previousOutputs: DataField[] = [];

            for (const stepId of stepIds) {
                try {
                    // 传递前序步骤的输出作为上下文
                    const result = await analyzeStepExamples({
                        stepId,
                        previousOutputs: previousOutputs.length > 0 ? previousOutputs : undefined,
                    });
                    results.push(result);

                    // 更新 previousOutputs 为当前步骤的输出
                    // 这样下一步就知道可以用哪些变量
                    previousOutputs = result.result.contract.outputs;

                } catch (error) {
                    // 继续处理其他步骤，即使某个步骤分析失败
                    console.warn(`Analysis failed for step ${stepId}:`, error);
                    // 分析失败时不更新 previousOutputs，保持上一个有效的
                }
            }

            return results;
        },
    });
}
