import {
    ActionMapping,
    ActionMappingListResponse,
    ActionMappingResponse,
    ActionMappingUpdateRequest,
    CostMetricsResponse,
    DryRunRequest,
    DryRunResponse,
    ExecuteRequest,
    ExecuteResponse,
    FunctionChain,
    FunctionChainListResponse,
    FunctionChainResponse,
    FunctionChainUpdateRequest,
    HealthResponse,
    Intent,
    IntentListResponse,
    IntentResponse,
    IntentUpdateRequest,
    LogQueryResponse,
    Model,
    ModelListResponse,
    ModelResponse,
    ModelUpdateRequest,
    QueueStatusResponse,
    ReplayRequest,
    ReplayResponse,
    RoutingConfigResponse,
    RoutingConfigUpdateRequest,
    Tool,
    ToolListResponse,
    ToolResponse,
    ToolUpdateRequest,
} from "./types";

const BASE_URL = import.meta.env.VITE_COSMO2_API_BASE_URL || "https://api.cosmo.local";

class Cosmo2Client {
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${BASE_URL}${endpoint}`;
        const headers = {
            "Content-Type": "application/json",
            ...options.headers,
        };

        // Forward auth token if available (assuming generic pattern, adjust as needed)
        const token = localStorage.getItem("sb-access-token");
        if (token) {
            // @ts-ignore
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody?.error?.message || `API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    // Execution
    async execute(data: ExecuteRequest): Promise<ExecuteResponse> {
        return this.request("/v2/execute", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    async *executeStream(data: ExecuteRequest): AsyncGenerator<string, void, unknown> {
        const url = `${BASE_URL}/v2/execute/stream`; // Assuming stream endpoint or ?stream=true
        // Update data to request stream mode if necessary, though separate endpoint is common
        // Or if it's the same endpoint:
        // const url = `${BASE_URL}/v2/execute`;
        // data.mode = 'async' | 'stream' ?

        const token = localStorage.getItem("sb-access-token");
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error(`Stream Error: ${response.status}`);
        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");

            // Keep the last partial line in the buffer
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (line.trim() === "" || line.startsWith(":")) continue;
                if (line.startsWith("data: ")) {
                    const data = line.slice(6);
                    if (data === "[DONE]") return;
                    yield data;
                }
            }
        }
    }

    async dryRun(data: DryRunRequest): Promise<DryRunResponse> {
        return this.request("/v2/dry-run", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    async replay(data: ReplayRequest): Promise<ReplayResponse> {
        return this.request("/v2/replay", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    // Models
    async getModels(includeDisabled = false): Promise<Model[]> {
        const res = await this.request<ModelListResponse>(`/v2/models?includeDisabled=${includeDisabled}`);
        return res.data;
    }

    async updateModel(modelId: string, updates: ModelUpdateRequest): Promise<Model> {
        const res = await this.request<ModelResponse>(`/v2/models/${modelId}`, {
            method: "PUT",
            body: JSON.stringify(updates),
        });
        return res.data;
    }

    // Routing
    async getRoutingConfig(): Promise<RoutingConfigResponse["data"]> {
        const res = await this.request<RoutingConfigResponse>("/v2/routing/config");
        return res.data;
    }

    async updateRoutingConfig(config: RoutingConfigUpdateRequest["config"]): Promise<RoutingConfigResponse["data"]> {
        const res = await this.request<RoutingConfigResponse>("/v2/routing/config", {
            method: "PUT",
            body: JSON.stringify({ config }),
        });
        return res.data;
    }

    // Intents
    async getIntents(includeInactive = false): Promise<Intent[]> {
        const res = await this.request<IntentListResponse>(`/v2/intents?includeInactive=${includeInactive}`);
        return res.data;
    }

    async updateIntent(intentKey: string, updates: IntentUpdateRequest): Promise<Intent> {
        const res = await this.request<IntentResponse>(`/v2/intents/${intentKey}`, {
            method: "PUT",
            body: JSON.stringify(updates),
        });
        return res.data;
    }

    // Action Mappings
    async getActionMappings(includeInactive = false): Promise<ActionMapping[]> {
        const res = await this.request<ActionMappingListResponse>(`/v2/action-mappings?includeInactive=${includeInactive}`);
        return res.data;
    }

    async updateActionMapping(mappingId: string, updates: ActionMappingUpdateRequest): Promise<ActionMapping> {
        const res = await this.request<ActionMappingResponse>(`/v2/action-mappings/${mappingId}`, {
            method: "PUT",
            body: JSON.stringify(updates),
        });
        return res.data;
    }

    // Function Chains
    async getFunctionChains(includeInactive = false): Promise<FunctionChain[]> {
        const res = await this.request<FunctionChainListResponse>(`/v2/function-chains?includeInactive=${includeInactive}`);
        return res.data;
    }

    async updateFunctionChain(chainKey: string, updates: FunctionChainUpdateRequest): Promise<FunctionChain> {
        const res = await this.request<FunctionChainResponse>(`/v2/function-chains/${chainKey}`, {
            method: "PUT",
            body: JSON.stringify(updates),
        });
        return res.data;
    }

    // Tools / Functions
    // Tools / Functions
    async getTools(): Promise<Tool[]> {
        // Placeholder stub for now, as specific endpoint might be different or dynamic
        // Try/catch just in case we wire it to real endpoint later and it fails
        try {
            const res = await this.request<ToolListResponse>("/v2/tools");
            return res.data;
        } catch (e) {
            // Return mock tools if API fails or doesn't exist yet (soft degrade for UI)
            console.warn("Failed to fetch tools, using mock data", e);
            return [];
        }
    }

    async createTool(tool: ToolUpdateRequest): Promise<Tool> {
        const res = await this.request<ToolResponse>("/v2/tools", {
            method: "POST",
            body: JSON.stringify(tool),
        });
        return res.data;
    }

    async updateTool(toolId: string, updates: ToolUpdateRequest): Promise<Tool> {
        const res = await this.request<ToolResponse>(`/v2/tools/${toolId}`, {
            method: "PUT",
            body: JSON.stringify(updates),
        });
        return res.data;
    }

    async deleteTool(toolId: string): Promise<void> {
        await this.request(`/v2/tools/${toolId}`, {
            method: "DELETE",
        });
    }

    // Metrics
    async getCosts(from?: string, to?: string, groupBy: "hour" | "day" | "week" | "month" = "day"): Promise<CostMetricsResponse["data"]> {
        const params = new URLSearchParams({ groupBy });
        if (from) params.append("from", from);
        if (to) params.append("to", to);

        const res = await this.request<CostMetricsResponse>(`/v2/metrics/costs?${params.toString()}`);
        return res.data;
    }

    // Ops
    async getHealth(): Promise<HealthResponse> {
        return this.request<HealthResponse>("/v2/health");
    }

    async getQueueStatus(): Promise<QueueStatusResponse> {
        return this.request<QueueStatusResponse>("/v2/queue");
    }

    // Logs
    async getLogs(requestId?: string, level?: string, limit = 50): Promise<LogQueryResponse["data"]> {
        const params = new URLSearchParams();
        if (requestId) params.append("requestId", requestId);
        if (level) params.append("level", level);
        params.append("limit", limit.toString());

        const res = await this.request<LogQueryResponse>(`/v2/logs?${params.toString()}`);
        return res.data;
    }
}

export const cosmo2 = new Cosmo2Client();
