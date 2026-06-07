import { useEffect, useRef, useState } from "react";
import type { BinFillFrame, ConnectionStatus } from "../types";

export type Options = {
  enabled: boolean;
  url: string;
  historySize?: number;
  onFrame?: (frame: BinFillFrame) => void;
};

type State = {
  status: ConnectionStatus;
  latest: BinFillFrame | null;
  history: BinFillFrame[];
};

const isValidBinFrame = (data: unknown): data is BinFillFrame => {
  if (typeof data !== "object" || data === null) return false;
  const frame = data as Record<string, unknown>;
  const compartments = frame.compartments as Record<string, unknown> | undefined;
  return (
    typeof frame.device_id === "string" &&
    typeof frame.timestamp_ms === "number" &&
    typeof compartments === "object" &&
    compartments !== null &&
    typeof (compartments.trash as Record<string, unknown>)?.fill_level_percent === "number" &&
    typeof (compartments.recycling as Record<string, unknown>)?.fill_level_percent === "number" &&
    typeof (compartments.compost as Record<string, unknown>)?.fill_level_percent === "number"
  );
};

export const useBinSocket = ({ enabled, url, historySize = 100, onFrame }: Options): State => {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [latest, setLatest] = useState<BinFillFrame | null>(null);
  const [history, setHistory] = useState<BinFillFrame[]>([]);
  const historyRef = useRef<BinFillFrame[]>([]);
  const onFrameRef = useRef<Options["onFrame"]>(onFrame);

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
          if (!isValidBinFrame(parsed)) return;
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
        reconnectTimer = window.setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        ws.close();
      }
    };
  }, [enabled, url, historySize]);

  return { status: enabled ? status : "idle", latest, history };
};
