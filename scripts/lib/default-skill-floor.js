// Skills every installation path equips, even when the user picks a profile,
// adds one skill directly, or browses the catalog by hand.
//
// `orient` and `suggest` are runtime always-on. `bro` is installed by default
// but remains conditionally loaded: its description routes human-language asks
// without paying for its body on unrelated turns.
export const DEFAULT_SKILL_FLOOR = Object.freeze(['orient', 'suggest', 'bro']);

export function withDefaultSkillFloor(skillIds = []) {
  return [...new Set([...DEFAULT_SKILL_FLOOR, ...skillIds])];
}

// Las skills del flujo que nombra el gate de código (targets/hook-once.mjs), más `retro`.
// Un proyecto con el gate conectado tiene que tenerlas todas: si el gate cambia y nombra una
// skill nueva (`implement-spec`, `pr`), el update la trae en vez de dejar el gate apuntando a
// algo que no está. Un proyecto sin gate (`codeHooks: false`) no recibe ninguna.
export const CODE_FLOW_FLOOR = Object.freeze([
  'grill-with-docs', 'wayfinder', 'to-spec', 'write-adr', 'to-tickets',
  'implement-spec', 'implement', 'code-review', 'pr', 'retro',
]);

export function withCodeFlowFloor(skillIds = [], policy) {
  if (policy?.codeHooks === false) return skillIds;
  return [...new Set([...skillIds, ...CODE_FLOW_FLOOR])];
}
