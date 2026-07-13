import type {
  CreateBinInput,
  GeneratedRoute,
  GeocodingResult,
  RouteStartPoint,
  ServerSettings,
  SmartBinDetails,
} from "./types";

const API_URL = import.meta.env.VITE_SMART_BIN_API_URL ?? "/api";

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });

  const responseText = await response.text();
  let body: Record<string, unknown> | null = null;
  if (responseText) {
    try {
      body = JSON.parse(responseText) as Record<string, unknown>;
    } catch {
      if (!response.ok) throw new Error(`Server error (${response.status}): ${responseText}`);
      throw new Error("The server returned an invalid response.");
    }
  }

  if (!response.ok) {
    const message = typeof body?.error === "string" ? body.error : `The server request failed (${response.status}).`;
    throw new Error(message);
  }
  if (!body) throw new Error("The server returned an empty response.");
  return body as T;
};

export const addBin = (bin: CreateBinInput) =>
  request<SmartBinDetails>("/bins", { method: "POST", body: JSON.stringify(bin) });

export const deleteBin = (binId: string) =>
  request<{ success: boolean }>(`/bins/${encodeURIComponent(binId)}`, { method: "DELETE" });

export const getBinDetails = (binId: string) =>
  request<SmartBinDetails>(`/bins/${encodeURIComponent(binId)}`);

export const createCollectionRoute = (threshold: number, startPoint: RouteStartPoint) =>
  request<GeneratedRoute>("/routes", {
    method: "POST",
    body: JSON.stringify({ threshold, start_point: startPoint }),
  });

export const searchLocations = (query: string) =>
  request<{ results: GeocodingResult[] }>(`/geocode?q=${encodeURIComponent(query)}`);

export const getServerSettings = () => request<ServerSettings>("/settings");

export const updateServerSettings = (simulationEnabled: boolean) =>
  request<ServerSettings>("/settings", {
    method: "PATCH",
    body: JSON.stringify({ simulation_enabled: simulationEnabled }),
  });

export const resetDemoFillLevels = () =>
  request<{ success: boolean; message: string }>("/settings/reset-fill-levels", { method: "POST" });
