export type RPCSchema<T> = T;

export class BrowserWindow {}
export class BrowserView {
  static defineRPC<T>(_options: unknown): unknown {
    return {
      request: async () => ({}),
    };
  }
}
