const SKIP_WORDS = ['syed', 'syeda', 'muhammad', 'mohammad', 'mian', 'mst'];

/**
 * Generates a suggested CRM handle from a full name, e.g.
 *   "Syed Arishiya Hassan" -> "arishiya_ha"
 *   "Maheen Amjad Raja"    -> "maheen_am"
 * Collisions are resolved by appending an incrementing number.
 */
function generateCrmName(fullName, existingCrmNames = []) {
  const parts = fullName.trim().split(/\s+/);
  let firstIdx = parts.findIndex((p) => !SKIP_WORDS.includes(p.toLowerCase()));
  if (firstIdx === -1) firstIdx = 0;

  const firstName = parts[firstIdx];
  const lastPart = parts[parts.length - 1] || '';
  const suffix = lastPart.slice(0, 2).toLowerCase();

  const base = `${firstName.toLowerCase()}_${suffix}`;

  let candidate = base;
  let i = 1;
  while (existingCrmNames.includes(candidate)) {
    i += 1;
    candidate = `${base}${i}`;
  }
  return candidate;
}

module.exports = { generateCrmName };
