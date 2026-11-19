#!/usr/bin/env python3
"""Find when each word is said, so effects can land on the right word.

usage: python words.py input.mp4            -> prints "12.34  word" lines and saves input.words.json
Uses faster-whisper with the model already downloaded by the preparation step
(~/.editor-video/modelos/whisper-*). It never downloads anything: without a local model it stops.
For a reel, `editor.py cortar` already leaves cortado.palabras.json; this is only for loose clips.
"""
import json, os, sys
from pathlib import Path

src = sys.argv[1]
out = os.path.splitext(src)[0] + '.words.json'
base = Path(os.environ.get('EDITOR_VIDEO_HOME') or (Path.home() / '.editor-video')) / 'modelos'
model_dir = next((base / f'whisper-{n}' for n in ('large-v3-turbo', 'small') if (base / f'whisper-{n}' / 'model.bin').exists()), None)
if model_dir is None:
    sys.exit(f'No hay modelo de voz en {base}. Repite la preparación (paso 1) con permiso para descargarlo.')
try:
    from faster_whisper import WhisperModel
except ImportError:
    sys.exit('Falta faster-whisper: usa el Python de ~/.editor-video/rutas.json (paso 1 de la preparación).')
model = WhisperModel(str(model_dir), device='cpu', compute_type='int8')
segs, _ = model.transcribe(src, word_timestamps=True, vad_filter=True)
words = [{'w': w.word.strip(), 's': round(w.start, 2), 'e': round(w.end, 2)} for s in segs for w in (s.words or [])]

with open(out, 'w', encoding='utf-8') as f:
    json.dump(words, f, indent=0, ensure_ascii=False)
for w in words: print(f"{w['s']:7.2f}  {w['w']}")
print(f'\nSaved {len(words)} words to {out}')
