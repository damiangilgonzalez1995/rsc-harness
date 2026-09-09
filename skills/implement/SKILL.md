---
name: implement
description: "Implements a piece of work from a spec or a set of tickets."
tags: ["implementation", "spec", "tickets"]
disable-model-invocation: true
---


Implementa el trabajo descrito por el usuario en la spec o los tickets.

Usa TDD (superpowers:test-driven-development) donde sea posible, en las costuras (seams) acordadas de antemano.

Ejecuta el typechecking con regularidad, archivos de test sueltos con regularidad, y la suite de tests completa una vez al final.

Al terminar, usa /code-review para revisar el trabajo.

Commitea tu trabajo en la rama actual.
