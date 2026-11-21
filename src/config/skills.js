// The skills a Pal can pick, shared by sign-up and settings.
export const PAL_SKILL_OPTIONS = [
  'Errand',
  'Delivery',
  'Car wash',
  'Plumbing',
  'Electrician',
  'House chores',
  'Mechanic',
  'Chef',
  'Caterer',
  'Nanny',
  'Security',
  'Hairstylist',
  'Barber',
  'Makeup artist',
  'Tailor',
  'Others',
];

const capitalise = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/** Splits "Dog walker, Tiler" into clean skill names. */
export function parseList(text) {
  return String(text || '')
    .split(/[,\n;]/)
    .map((item) => item.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .slice(0, 8);
}

/**
 * Whatever a Pal types under "Others" becomes one of their skills, so it shows in their
 * settings and joins the skills library. "Others" itself stays selected.
 */
export function mergeCustomSkills(selected = [], otherService = '') {
  const result = [...selected];
  if (selected.includes('Others')) {
    parseList(otherService).forEach((skill) => {
      const label = capitalise(skill.slice(0, 40));
      if (!result.some((item) => item.toLowerCase() === label.toLowerCase())) result.push(label);
    });
  }
  return result;
}

/** Skills that are not in the standard list (typed by the Pal). */
export const customSkillsOf = (selected = []) =>
  selected.filter((item) => !PAL_SKILL_OPTIONS.includes(item));
