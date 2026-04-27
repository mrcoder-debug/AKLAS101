export interface SimulatorConfig {
  src?: string;
  [key: string]: unknown;
}

export interface SimulatorAdapter {
  key: string;
  render(config: SimulatorConfig | null): React.ReactNode;
}
