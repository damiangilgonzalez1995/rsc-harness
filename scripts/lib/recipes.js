// `harness recipes …` — the CopyPasta-Kitchen recipe book: list the templates, read one, copy one.
//
// The recipes and the logic that serves them live in their own package, @damiangilgonzalez/copypasta.
// The harness depends on it at an exact version and calls it in-process, so there is one
// implementation of list/show/get and the recipe book a user gets is the one this release was
// tested with. Nothing here touches the network, an assistant or the harness state.

// `Any command takes --target`: the harness's own flags are not the recipe book's, which would
// reject them as unknown. Both `--target claude` and `--target=claude` are dropped.
const HARNESS_FLAGS = new Set(['--target']);

/** What the user typed for the recipe book: every token except `recipes` and the harness's own flags. */
export function recipeArgs(rawArgv) {
  const at = rawArgv.indexOf('recipes');
  if (at === -1) return [];
  const out = [];
  const rest = [...rawArgv.slice(0, at), ...rawArgv.slice(at + 1)];
  for (let i = 0; i < rest.length; i++) {
    const [flag] = rest[i].split('=');
    if (!HARNESS_FLAGS.has(flag)) { out.push(rest[i]); continue; }
    if (!rest[i].includes('=')) i++; // skip its value too
  }
  return out;
}

export async function runRecipes(rawArgv) {
  let copypasta;
  try {
    copypasta = await import('@damiangilgonzalez/copypasta');
  } catch (error) {
    if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error;
    console.error(
      'rsc: the recipe book (@damiangilgonzalez/copypasta) is not installed next to the harness.\n' +
      '     Reinstall the harness, or run it directly:  npx @damiangilgonzalez/copypasta list',
    );
    return 1;
  }
  return copypasta.main(recipeArgs(rawArgv), {
    out: (text) => process.stdout.write(text),
    err: (text) => process.stderr.write(text),
    command: 'harness recipes',
  });
}
