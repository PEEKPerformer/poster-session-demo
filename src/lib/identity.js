/**
 * Shared identity utilities — name display, avatar colors, placeholder detection.
 */

export function hashToHue(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}

export function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function isPlaceholderName(name) {
  return !name || /^Voter \d+$/i.test(name)
}

export function getFirstName(name) {
  if (isPlaceholderName(name)) return null
  return name.split(' ')[0]
}

/**
 * Returns display info for the identity chip and personalized greetings.
 * @param {{ code: string, name: string }} attendee
 * @returns {{ code: string, firstName: string|null, hue: number, initial: string }}
 */
export function getIdentityDisplay(attendee) {
  return {
    code: attendee.code,
    firstName: getFirstName(attendee.name),
    hue: hashToHue(attendee.code),
    initial: attendee.code[0],
  }
}
