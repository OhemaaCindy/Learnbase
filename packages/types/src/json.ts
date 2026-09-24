/**
 * The over-the-wire shape of `T`: every `Date` becomes the ISO string that
 * JSON.stringify actually produces. Use it whenever asserting that an API
 * response matches a contract type — asserting against the raw type would
 * claim the response contains Date objects, which it never does.
 */
export type JsonOf<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? JsonOf<U>[]
    : T extends object
      ? { [K in keyof T]: JsonOf<T[K]> }
      : T;
