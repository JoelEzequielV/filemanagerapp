export interface SafPlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
}
