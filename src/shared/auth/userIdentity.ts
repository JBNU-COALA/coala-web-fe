export function isSameUserId(left?: string | number | null, right?: string | number | null) {
  if (left == null || right == null) return false

  const leftNumber = Number(left)
  const rightNumber = Number(right)
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return leftNumber === rightNumber
  }

  return String(left) === String(right)
}
