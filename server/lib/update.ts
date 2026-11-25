// Builds the "SET" part of an UPDATE from validated data, for example "title = $3, budget = $4".
// Column names come from our own zod schemas (unknown keys are rejected there), never from the user.
export function buildSet(data: Record<string, unknown>, firstParam: number) {
  const keys = Object.keys(data).filter((k) => data[k] !== undefined);
  for (const k of keys) {
    if (!/^[a-z_]+$/.test(k)) throw new Error(`Unsafe column name: ${k}`);
  }
  return {
    set: keys.map((k, i) => `${k} = $${firstParam + i}`).join(', '),
    values: keys.map((k) => data[k]),
  };
}
