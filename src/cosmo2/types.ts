
/**
 * COSMO 2.0 API Types (client-side)
 * Generated manually for Spork wiring. Keep aligned with openapi.yaml.
 */

export type JsonValue =
    | string
    | number
    | boolean
    | null
    | { [k: string]: JsonValue }
    | JsonValue[];

export type RoutingProfile = "balanced" | "cost_optimized" | "performance_first" | "real_time";

export interface ClientMeta {
    client?: string;        // e.g. "spork-web"
    clientVersion?: string; // e.g. "1.0.0"
    traceId?: string;
}

export type AttachmentType = "document" | "image" | "audio" | "other";

export interface AttachmentRef {
    id: string;
    type: AttachmentType;
    name?: string;
    url?: string;
}

export interface ExecutionContext {
    conversationId?: string;
    attachments?: AttachmentRef[];
    knowledgeBaseIds?: string[];
    personaId?: string;
    instructionSetIds?: string[];
}

export interface ExecutionPreferences {
    routingProfile?: RoutingProfile;
    forceModelId?: string;
    maxCostUsd?: number;
    maxLatencyMs?: number;
}

export type ExecuteMode = "sync" | "async";

export interface ExecuteRequest {
    input: string;
    workspaceId?: string;
    userId?: string;
    mode?: ExecuteMode;
    preferences?: ExecutionPreferences;
    context?: ExecutionContext;
    clientMeta?: ClientMeta;
}

export type PlanStepType = "model_call" | "tool_call" | "chain_call" | "transform" | "validate";

export interface PlanStep {
    stepId: string;
    type: PlanStepType;
    description: string;
    modelId?: string;
    toolId?: string;
    chainKey?: string;
    inputSchema?: JsonValue;
    outputSchema?: JsonValue;
    requiresApproval?: boolean;
}

export interface ExecutionPlan {
    version: number;
    summary?: string;
    steps: PlanStep[];
}

export type ArtifactType = "file" | "link" | "dataset" | "report";

export interface ArtifactRef {
    id: string;
    type: ArtifactType;
    name?: string;
    url?: string;
}

export interface ExecutionResult {
    output?: string;
    structured?: JsonValue;
    artifacts?: ArtifactRef[];
}

export interface CostSummary {
    modelId?: string;
    inputTokens?: number;
    outputTokens?: number;
    toolCalls?: number;
    costUsd?: number;
    latencyMs?: number;
}

export type ExecuteStatus = "completed" | "queued" | "failed";

export interface ExecuteResponse {
    requestId: string;
    status: ExecuteStatus;
    plan?: ExecutionPlan;
    result?: ExecutionResult;
    costs?: CostSummary;
    logsUrl?: string;
}

export interface DryRunRequest {
    input: string;
    workspaceId?: string;
    userId?: string;
    preferences?: ExecutionPreferences;
    context?: ExecutionContext;
    clientMeta?: ClientMeta;
}

export interface CostEstimate {
    estimatedInputTokens?: number;
    estimatedOutputTokens?: number;
    estimatedToolCalls?: number;
    estimatedCostUsd?: number;
}

export interface DryRunResponse {
    requestId: string;
    plan: ExecutionPlan;
    estimatedCosts?: CostEstimate;
}

export type ReplayMode = "validate_only" | "replay_execute";
export type ReplayStatus = "replayed" | "validated" | "failed";

export interface ReplayRequest {
    requestId: string;
    mode?: ReplayMode;
}

export interface ReplayResponse {
    requestId: string;
    status: ReplayStatus;
    plan?: ExecutionPlan;
    result?: ExecutionResult;
    costs?: CostSummary;
}

/** Models */

export type ModelCategory = "general" | "coding" | "vision" | "reasoning" | "fast" | "cheap";

export interface Model {
    model_id: string;
    name: string;
    provider: string;
    description?: string;
    best_for?: ModelCategory;
    best_for_description?: string;
    context_length?: number;
    max_completion_tokens?: number;
    input_modalities?: string[];
    output_modalities?: string[];
    pricing_prompt?: number;     // USD per 1M input tokens
    pricing_completion?: number; // USD per 1M output tokens
    default_temperature?: number;
    default_top_p?: number;
    default_top_k?: number;
    default_max_tokens?: number;
    default_frequency_penalty?: number;
    default_presence_penalty?: number;
    rate_limit_rpm?: number;
    rate_limit_tpm?: number;
    requires_api_key?: boolean;
    is_free?: boolean;
    is_default?: boolean;
    is_active?: boolean;
    display_order?: number;
    updated_at?: string;
}

export interface ModelListResponse { data: Model[]; }
export interface ModelResponse { data: Model; }

export type ModelUpdateRequest = Partial<Omit<Model, "model_id" | "updated_at">>;

/** Routing */

export interface RoutingWeights {
    quality?: number;
    cost?: number;
    speed?: number;
    context?: number;
}

export interface RoutingBudgets {
    monthlyUsd?: number;
    perRequestUsd?: number;
}

export interface RoutingFlags {
    enableDynamicRouting?: boolean;
    enableCostGuards?: boolean;
}

export interface RoutingConfig {
    defaultModelId?: string;
    imageModelId?: string;
    kbModelId?: string;
    fallbackModelId?: string;
    routingProfile?: RoutingProfile;
    weights?: RoutingWeights;
    budgets?: RoutingBudgets;
    flags?: RoutingFlags;
}

export interface RoutingConfigUpdateRequest { config: RoutingConfig; }
export interface RoutingConfigResponse { data: { config: RoutingConfig; updated_at?: string }; }

/** Intents */

export interface Intent {
    intent_key: string;
    display_name: string;
    description?: string;
    category?: string;
    keywords?: string[];
    priority?: number;
    required_functions?: string[];
    preferred_models?: string[];
    context_needs?: string[];
    is_active?: boolean;
    updated_at?: string;
}

export type IntentUpdateRequest = Partial<Omit<Intent, "intent_key" | "updated_at">>;
export interface IntentListResponse { data: Intent[]; }
export interface IntentResponse { data: Intent; }

/** Action Mappings */

export type ActionType = "function" | "chain" | "model_call" | "external_api" | "system";

export interface ActionMapping {
    id: string;
    intent_key: string;
    action_key: string;
    action_type: ActionType;
    action_config?: JsonValue;
    parameter_patterns?: JsonValue;
    required_context?: string[];
    priority?: number;
    conditions?: JsonValue;
    is_active?: boolean;
    updated_at?: string;
}

export type ActionMappingUpdateRequest = Partial<Omit<ActionMapping, "id" | "intent_key" | "updated_at">>;
export interface ActionMappingListResponse { data: ActionMapping[]; }
export interface ActionMappingResponse { data: ActionMapping; }

/** Function Chains */

export type FunctionChainStepType = "function" | "model_call" | "transform" | "validate";

export interface FunctionChainStep {
    stepKey: string;
    type: FunctionChainStepType;
    functionId?: string;
    modelId?: string;
    config?: JsonValue;
}

export interface FunctionChain {
    chain_key: string;
    display_name: string;
    description?: string;
    is_active?: boolean;
    steps: FunctionChainStep[];
    version?: number;
    updated_at?: string;
}

export type FunctionChainUpdateRequest = Partial<Omit<FunctionChain, "chain_key" | "updated_at">>;
export interface FunctionChainListResponse { data: FunctionChain[]; }
export interface FunctionChainResponse { data: FunctionChain; }

/** Tools / Functions */

export interface Tool {
    id: string;
    name: string;
    function_key: string;
    description?: string;
    category?: string;
    is_enabled?: boolean;
    is_core?: boolean;

    // Metadata / Implementation
    functionType?: "system" | "custom" | "plugin";
    source?: string; // code path or url
    inputSchema?: JsonValue;
    outputSchema?: JsonValue;

    // Cosmo Routing/Matching
    tags?: string[];
    eventsEmitted?: string[];
    dependencies?: string[];

    parameters?: JsonValue;
    display_order?: number;
    updated_at?: string;
}

export type ToolUpdateRequest = Partial<Omit<Tool, "id" | "updated_at">>;
export interface ToolListResponse { data: Tool[]; }
export interface ToolResponse { data: Tool; }

/** Metrics / Ops / Logs */

export interface CostMetricPoint {
    ts: string;
    costUsd: number;
    inputTokens?: number;
    outputTokens?: number;
    toolCalls?: number;
    modelId?: string;
}

export interface CostMetricsResponse { data: { points: CostMetricPoint[] }; }

export type HealthStatus = "ok" | "degraded" | "down";

export interface HealthServiceStatus {
    name: string;
    status: HealthStatus;
    latencyMs?: number;
    details?: JsonValue;
}

export interface HealthResponse {
    status: HealthStatus;
    services?: HealthServiceStatus[];
    time?: string;
}

export type QueueStatus = "enabled" | "disabled";

export interface QueueStatusResponse {
    status: QueueStatus;
    depth?: number;
    active?: number;
    failed?: number;
    oldestJobTs?: string;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
    ts: string;
    level: LogLevel;
    message: string;
    requestId?: string;
    component?: string;
    data?: JsonValue;
}

export interface LogQueryResponse {
    data: {
        entries: LogEntry[];
        nextCursor?: string;
    };
}

/** Error envelope */

export interface ApiError {
    code: string;
    message: string;
    details?: JsonValue;
}

export interface ErrorResponse {
    error: ApiError;
    requestId?: string;
}
