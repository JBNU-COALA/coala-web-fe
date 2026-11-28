export function serializeServiceFeatures(value: string) {
  const features: string[] = []
  let leadingWhitespace = ''
  for (const line of value.split('\n')) {
    if (line.trim()) {
      features.push(leadingWhitespace + line)
      leadingWhitespace = ''
    } else if (features.length) {
      features[features.length - 1] += `\n${line}`
    } else {
      leadingWhitespace += `${line}\n`
    }
  }
  return features
}
