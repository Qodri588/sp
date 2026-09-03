/* eslint-disable @typescript-eslint/no-empty-function, @typescript-eslint/no-extraneous-class, @typescript-eslint/no-unnecessary-type-parameters, @typescript-eslint/no-useless-constructor */

export class Electroview {
  constructor(_opts?: unknown) {}
  static defineRPC<T>(_options: unknown): T {
    return {
      request: async () => ({}),
    } as T;
  }
}
