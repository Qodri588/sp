/* eslint-disable @typescript-eslint/no-extraneous-class, @typescript-eslint/no-unnecessary-type-parameters */

export type RPCSchema<T> = T;

export class BrowserWindow {}
export class BrowserView {
  static defineRPC<T>(_options: unknown): T {
    return {
      request: async () => ({}),
    } as T;
  }
}
