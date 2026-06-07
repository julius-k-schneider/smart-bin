import type { BinFillFrame } from "../types";

export type BinConfig = {
  binId: string;
  label: string;
  url: string;
};

export const BINS: BinConfig[] = [
  {
    binId: "smart-bin-01",
    label: "Smart Bin Prototype",
    url: import.meta.env.VITE_SMART_BIN_URL ?? "ws://localhost:8181",
  },
];

export const getBinConfig = (binId: string): BinConfig => {
  const bin = BINS.find((candidate) => candidate.binId === binId);
  if (!bin) {
    throw new Error(`Unknown bin ID: ${binId}`);
  }
  return bin;
};
