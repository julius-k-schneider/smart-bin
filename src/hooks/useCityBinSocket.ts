import { useEffect, useRef, useState } from "react";
import type { CityBinSnapshotFrame, ConnectionStatus } from "../types";

export type UseCityBinSocketOptions = {
  enabled: boolean;
  url: string;
  historySize?: number;
  onFrame?: (frame: CityBinSnapshotFrame) => void;
};

export type UseCityBinSocketState = {
  status: ConnectionStatus;
  latest: CityBinSnapshotFrame | null;
  history: CityBinSnapshotFrame[];
};

const isValidCityFrame = (data: unknown): data is CityBinSnapshotFrame => {
  if (typeof data !== "object" || data === null) return false;
  const frame = data as Record<string, unknown>;
  
  if (typeof frame.city !== "string") return false;
  if (typeof frame.timestamp_ms !== "number") return false;
  if (!Array.isArray(frame.bins)) return false;
  
  return (frame.bins as unknown[]).every((bin) => {
    if (typeof bin !== "object" || bin === null) return false;
    const b = bin as Record<string, unknown>;
    const compartments = b.compartments as Record<string, unknown> | undefined;
    return (
      typeof b.bin_id === "string" &&
      typeof b.lat === "number" &&
      typeof b.lng === "number" &&
      typeof compartments === "object" &&
      compartments !== null &&
      ["trash", "recycling", "compost"].every((key) => {
        const compartment = compartments[key];
        if (typeof compartment !== "object" || compartment === null) return false;
        const c = compartment as Record<string, unknown>;
        return typeof c.fill_level_percent === "number" && typeof c.status === "string";
      })
    );
  });
};

export const useCityBinSocket = ({
  enabled,
  url,
  historySize = 100,
  onFrame,
}: UseCityBinSocketOptions): UseCityBinSocketState => {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [latest, setLatest] = useState<CityBinSnapshotFrame | null>(null);
  const [history, setHistory] = useState<CityBinSnapshotFrame[]>([]);
  const historyRef = useRef<CityBinSnapshotFrame[]>([]);
  const onFrameRef = useRef<UseCityBinSocketOptions["onFrame"]>(onFrame);

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }

    let ws: WebSocket | null = null;
    let reconnectTimer: number | undefined;
    let cancelled = false;

    const connect = () => {
      setStatus("connecting");
      ws = new WebSocket(url);

      ws.onopen = () => {
        if (cancelled) return;
        setStatus("open");
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        try {
          const parsed = JSON.parse(event.data);
          if (!isValidCityFrame(parsed)) return;
          
          setLatest(parsed);
          onFrameRef.current?.(parsed);

          const nextHistory = [...historyRef.current, parsed];
          if (nextHistory.length > historySize) {
            nextHistory.splice(0, nextHistory.length - historySize);
          }
          historyRef.current = nextHistory;
          setHistory(nextHistory);
        } catch {
          // ignore malformed payloads
        }
      };

      ws.onerror = () => {
        if (cancelled) return;
        setStatus("error");
      };

      ws.onclose = () => {
        if (cancelled) return;
        setStatus("closed");
        // Reconnect after a short delay.
        reconnectTimer = window.setTimeout(() => {
          if (!cancelled) {
            connect();
          }
        }, 2000);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (ws) {
        ws.close();
      }
      if (reconnectTimer !== undefined) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [enabled, url, historySize]);

  return { status, latest, history };
};
