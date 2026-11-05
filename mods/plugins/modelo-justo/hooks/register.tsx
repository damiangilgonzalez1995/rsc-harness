import type { Register } from 'claude-code'

const MODELS = { simple: 'haiku', normal: 'sonnet', compleja: 'opus' } as const
const LABEL = { simple: 'Haiku', normal: 'Sonnet', compleja: 'Opus' } as const
type Level = keyof typeof MODELS

const SYSTEM = `Clasifica la petición de un usuario a un agente de código en UNA palabra:
simple (pregunta corta, cambio trivial, lectura, renombrar, formato),
normal (implementar o arreglar algo acotado, explicar código),
compleja (arquitectura, depuración difícil, refactor grande, varios ficheros, análisis profundo).
Responde únicamente: simple, normal o compleja.`

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'modelo-justo', description: 'Activa o apaga el selector de modelo: /modelo-justo on|off' })
    return next(e)
  })

  on('command.run', { command: 'modelo-justo' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    if (arg !== 'on' && arg !== 'off') {
      const isOn = (await $.store.get('enabled')) !== false
      return { text: `Modelo justo está ${isOn ? 'activado' : 'apagado'}. Usa /modelo-justo on|off.` }
    }
    await $.store.set('enabled', arg === 'on')
    $.ui.status(arg === 'on' ? 'Modelo justo: activado' : undefined)
    return { text: `Modelo justo ${arg === 'on' ? 'activado' : 'apagado'}.` }
  })

  on('prompt.submit', async ($, e, next) => {
    if (e.command || e.origin?.kind === 'plugin' || (await $.store.get('enabled')) === false) return next(e)
    try {
      const r = await $.model.complete({ model: 'haiku', system: SYSTEM, prompt: e.text.slice(0, 4000), maxTokens: 10, effort: 'low', timeoutMs: 6000 })
      const word = r.isAnswered ? r.text.trim().toLowerCase() : ''
      const level = (['simple', 'normal', 'compleja'] as Level[]).find(l => word.startsWith(l))
      if (level) {
        const { deny } = await $.config.set({ key: 'model', value: MODELS[level] })
        $.ui.status(deny ? `Modelo justo: no pude cambiar (${deny})` : `Modelo justo: ${LABEL[level]} · tarea ${level}`)
      }
    } catch {
      // si falla la clasificación, la petición sigue con el modelo actual
    }
    return next(e)
  })
}
