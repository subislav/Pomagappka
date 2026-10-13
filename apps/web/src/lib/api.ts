import { healthResponseSchema, type HealthResponse, } from "@pomagappka/shared";
export async function fetchHealth(): Promise<HealthResponse> {
    const response = await fetch("/api/health");
    if (!response.ok && response.status !== 503) {
        throw new Error(`Health check failed with status ${response.status}`);
    }
    const json: unknown = await response.json();
    return healthResponseSchema.parse(json);
}
