/**
 * mdast 노드 shape 기반 안정 해시.
 *
 * `position` / `data` 필드는 해시에서 제외하여,
 * 소스 위치가 바뀌어도 동일 구조의 노드는 동일 key를 생성한다.
 */

/** 해시에서 제외할 프로퍼티 키 */
const EXCLUDED_KEYS = new Set(["position", "data"]);

/**
 * mdast 노드(또는 임의 키 소스)를 FNV-1a 해시 문자열로 변환한다.
 *
 * - `type` + 재귀 구조 + literal 값에서 파생된 안정 해시를 생산한다.
 * - `position` 필드는 해시 대상에서 제외되므로,
 *   동일 내용이 다른 줄에 등장해도 같은 키를 반환한다.
 */
export function nodeHash(node: unknown): string {
  return fnv1a(stableSerialize(node));
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }

  const objectValue = value as Record<string, unknown>;
  const keys = Object.keys(objectValue)
    .filter((key) => !EXCLUDED_KEYS.has(key))
    .sort();

  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(objectValue[key])}`)
    .join(",")}}`;
}

function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}
