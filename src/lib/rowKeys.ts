/**
 * Stable React keys for editable lists.
 *
 * These rows are keyed by array index today, which is wrong for any list you
 * can delete from the middle: React matches old and new children by key, so
 * removing row 1 of 3 makes row 2 inherit row 1's element — and with it any
 * state that element owns. An IconPicker left open, its search text, and input
 * focus all jump to the wrong row.
 *
 * A key is attached when the row is created and travels with it, so identity
 * survives reordering and deletion. `_key` is client-only and is stripped
 * before anything is sent to the API.
 */

let counter = 0

export function nextRowKey(): string {
  counter += 1
  return `row_${counter}`
}

export type Keyed<T> = T & { _key: string }

export function withKeys<T extends object>(items: T[]): Keyed<T>[] {
  return items.map((item) => ({ ...item, _key: nextRowKey() }) as Keyed<T>)
}

export function stripKeys<T extends object>(items: Keyed<T>[]): T[] {
  return items.map(({ _key, ...rest }) => {
    void _key
    return rest as unknown as T
  })
}

/** Drop `_key` from a single row before comparing it against server data. */
export function stripKey<T extends object>(item: Keyed<T>): T {
  const { _key, ...rest } = item
  void _key
  return rest as unknown as T
}
