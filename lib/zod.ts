export const Ok = <T>(data: T) => ({ ok: true as const, data });
export const Fail = <E>(error: E) => ({ ok: false as const, error });

export type Ok<T> = { ok: true; data: T };
export type Fail<E = string> = { ok: false; error: E };
export type Result<T, E = string> = Ok<T> | Fail<E>;

export function resultFromPromise<T>(p: Promise<T>): Promise<Result<T, string>> {
  return p.then(Ok).catch((e: unknown) => Fail(e instanceof Error ? e.message : String(e)));
}
