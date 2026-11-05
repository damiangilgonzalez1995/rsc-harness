import type { Register } from 'claude-code'

const SYSTEM = `Eres un reescritor de prompts para Claude Code. Recibes un borrador corto y devuelves SOLO el prompt reescrito, en el idioma del borrador, sin explicaciones ni bloques de código.
El prompt reescrito debe contener, en este orden:
1. Tarea: qué hay que hacer, concreta.
2. Skills: nombra (con su nombre exacto) las skills instaladas que encajen con la tarea. Si ninguna encaja, omite la sección.
3. Contexto: detalles relevantes del proyecto actual que se deduzcan del contexto dado. No inventes nada.
4. Antes de empezar, pregúntame: lista de las decisiones clave que debes consultarme.
5. Resultado final: cómo debe quedar lo entregado y cómo se comprueba.`

// Del system prompt solo sirve al reescritor lo que habla de skills, entorno y memoria del proyecto.
function relevant(sections: readonly { text: string }[]): string {
  return sections
    .map(s => s.text)
    .filter(t => /skill|CLAUDE\.md|working directory/i.test(t))
    .join('\n\n')
    .slice(0, 12000)
}

export const register: Register = on => {
  let busy = false

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const { Box, Button, Text } = $.ui.resolve(e)

    return (
      <Box>
        <Button
          key="enhance"
          label="Enhance"
          hotkey="e"
          onPress={async () => {
            if (busy) return
            const { text } = await $.prompt.read()
            if (!text.trim()) {
              $.ui.toast('Escribe primero un borrador y pulsa Enhance.')
              return
            }
            busy = true
            $.ui.status('Prompt Enhancer: reescribiendo…')
            try {
              const composed = await $.prompt.compose().catch(() => ({ sections: [] }))
              const r = await $.model.complete({
                model: 'sonnet',
                system: SYSTEM,
                prompt: `<contexto>\n${relevant(composed.sections)}\n</contexto>\n\n<borrador>\n${text}\n</borrador>`,
                maxTokens: 1500,
                timeoutMs: 60000,
              })
              if (r.isAnswered && r.text.trim()) {
                await $.prompt.fill({ text: r.text.trim(), mode: 'replace' })
                $.ui.toast('Prompt reescrito. Revísalo y pulsa Send.')
              } else {
                $.ui.toast('No se pudo reescribir el prompt.')
              }
            } finally {
              busy = false
              $.ui.status(undefined)
            }
          }}
        />
        <Text> </Text>
        <Button
          key="send"
          label="Send"
          hotkey="s"
          onPress={async () => {
            const { text } = await $.prompt.read()
            if (!text.trim()) return
            await $.prompt.fill({ text: '', mode: 'replace' })
            void $.prompt.submit({ text, asUser: true })
          }}
        />
        <Text dimColor> (atajos: ctrl+x tab y luego e / s)</Text>
      </Box>
    )
  })
}
