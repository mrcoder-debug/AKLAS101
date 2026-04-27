// Simulator adapter registry. Add new adapters here as they are implemented.
// The key matches Lesson.simulatorKey in the database.

import type { SimulatorAdapter, SimulatorConfig } from "./types";
import { IframeSimulator } from "./iframe.adapter";
import React from "react";

const iframeAdapter: SimulatorAdapter = {
  key: "iframe",
  render: (config) => React.createElement(IframeSimulator, { config }),
};

const wokwiAdapter: SimulatorAdapter = {
  key: "wokwi",
  render: (config) => React.createElement(IframeSimulator, { config }),
};

const tinkercadAdapter: SimulatorAdapter = {
  key: "tinkercad",
  render: (config) => React.createElement(IframeSimulator, { config }),
};

const adapters: Map<string, SimulatorAdapter> = new Map([
  ["iframe", iframeAdapter],
  ["wokwi", wokwiAdapter],
  ["tinkercad", tinkercadAdapter],
]);

export function getAdapter(key: string): SimulatorAdapter | undefined {
  return adapters.get(key);
}

export function registerAdapter(adapter: SimulatorAdapter): void {
  adapters.set(adapter.key, adapter);
}
