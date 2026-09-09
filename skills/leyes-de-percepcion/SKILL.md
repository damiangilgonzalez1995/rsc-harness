---
name: leyes-de-percepcion
description: "Use when composing or reviewing a screen and you need to decide what the eye sees first and how things are grouped — proximity, similarity, common region, closure, continuity, figure-ground, the Von Restorff effect, and visual hierarchy. This is the package of Gestalt laws applied to interface design."
tags: ["gestalt", "visual-perception", "ui-design"]
---

# Leyes de percepcion

El ojo humano organiza lo que ve antes de que el cerebro lea una sola palabra. Estas leyes describen como lo hace. No son opiniones esteticas: son reflejos perceptivos. La unica decision que tienes es si los disenaste a proposito o los dejaste al azar.

Usalas para dos cosas: **componer** (decidir agrupacion y orden de lectura) y **diagnosticar** (por que una pantalla se siente ruidosa, plana o desordenada).

---

## 1. Proximidad — el espacio agrupa mas fuerte que nada

Los elementos cercanos se perciben como un grupo. El aire separa; la cercania implica relacion. Es la herramienta de agrupacion mas fundamental y la mas barata: no cuesta ni un pixel de tinta.

- **Entre grupos**: mas espacio para senalar separacion.
- **Dentro de un grupo**: menos espacio para senalar pertenencia.
- Lo que crea la jerarquia es la **relacion** entre el espacio interno y el externo, no un valor fijo en pixeles. Una regla practica solida: el hueco entre grupos al menos el doble que el hueco dentro de uno.

| Patron | Regla de proximidad |
|---|---|
| Campos de formulario | La etiqueta mas pegada a su campo que al campo siguiente |
| Contenido de tarjeta | Titulo, cuerpo y metadatos juntos; la tarjeta separada de las vecinas |
| Cabeceras de seccion | Menos espacio debajo de la cabecera (hacia su contenido) que encima (desde la seccion anterior) |
| Grupos de botones | Acciones relacionadas juntas; la accion destructiva separada |

**Diagnostico**: si una cabecera parece pertenecer a la seccion equivocada, casi siempre es porque tiene el mismo espacio arriba que abajo.

## 2. Similitud — el aspecto compartido agrupa a distancia

Los elementos que comparten caracteristicas visuales se perciben como relacionados, aunque no esten juntos. La mente agrupa por parecido de forma automatica.

La similitud se transmite por:
- **Color**: el mismo relleno senala la misma categoria, rol o estado.
- **Forma**: iconos del mismo estilo (contorno frente a relleno) se leen como un conjunto.
- **Tamano**: elementos del mismo tamano se leen como pares; la diferencia de tamano senala jerarquia.
- **Estilo**: mismo peso de ilustracion, mismo tratamiento tipografico, mismo radio, mismo grosor de trazo.

**Proximidad frente a similitud**: cuando chocan, gana la proximidad para lo cercano y la similitud para lo lejano. Si dos elementos deben leerse como pares pero estan en extremos opuestos de la pantalla, la unica herramienta que te queda es la similitud.

**Diagnostico**: si dos cosas se ven iguales pero hacen cosas distintas, la interfaz esta mintiendo. Y al reves: si dos cosas hacen lo mismo y se ven distintas, el usuario cree que son distintas.

## 3. Region comun — un contenedor agrupa aunque haya distancia

Los elementos encerrados en un limite compartido o sobre un fondo compartido se perciben como grupo, aunque no esten especialmente cerca. Es una de las senales de agrupacion mas fuertes que existen.

| | Proximidad | Region comun |
|---|---|---|
| Mecanismo | Cercania espacial | Limite o fondo compartido |
| Ideal para | Elementos ya cercanos | Elementos que necesitan un limite explicito o mas fuerte |
| Coste | Cero: solo espaciado | Peso visual: hay un borde o un fondo |
| Cuando preferirla | Casi toda la agrupacion de layout | Tarjetas, paneles, barras laterales, pestanas, modales |

Usa proximidad primero; anade region comun cuando la proximidad no baste o cuando el limite del grupo deba ser explicito (una tarjeta sobre la que se puede actuar como unidad, una seccion dentro de un formulario mas grande).

## 4. Cierre — el ojo completa las formas insinuadas

La mente prefiere las formas completas y familiares. Ante una forma incompleta, rellena las partes que faltan. **No necesitas dibujar todas las lineas para crear un limite visual: necesitas informacion suficiente para que la mente cierre la forma.**

- Un circulo con un hueco se lee como anillo o indicador de progreso.
- Un elemento que asoma parcialmente por el borde de un contenedor con scroll comunica "hay mas" sin ninguna etiqueta.
- Una rejilla de tarjetas sin bordes, solo con alineacion y aire, se lee igual de agrupada y pesa mucho menos.

Usalo para **quitar peso visual**: cada borde y cada linea separadora que puedas borrar sin perder la estructura es una ganancia.

## 5. Continuidad — el ojo sigue las lineas y las alineaciones

La mente prefiere trayectorias suaves y continuas a los cambios bruscos de direccion. Los elementos dispuestos a lo largo de una linea, aunque sea implicita, se perciben como relacionados, y el ojo recorre esa linea.

- La alineacion es la aplicacion mas basica: un borde izquierdo continuo crea un eje vertical que el ojo sigue de arriba abajo.
- Cada borde suelto rompe la continuidad y se lee como ruido.
- **Romper la continuidad a proposito senala un cambio**: un elemento que rompe la alineacion se lee como el inicio de otra cosa.
- En secuencias (pasos, lineas de tiempo, carruseles), la continuidad es lo que comunica "esto va detras de aquello".

## 6. Figura-fondo — que capa esta delante y es accionable

La mente separa automaticamente el campo visual en sujeto (figura) y contexto (fondo). La figura se percibe delante, delimitada y foco de atencion. El fondo se percibe detras, sin limites y en retroceso.

| Figura (primer plano) | Fondo |
|---|---|
| Parece estar delante | Parece estar detras |
| Delimitada, con bordes | Sin limites, se extiende mas alla |
| Foco de atencion | Contexto para la atencion |

Esto no es opcional: toda superficie de UI dispara la separacion figura-fondo. La pregunta es si la disenaste tu.

- **Modales y capas**: el velo de oscurecimiento existe para empujar el contenido al fondo y dejar claro que capa es accionable. Sin el, el usuario no sabe donde puede hacer clic.
- **Ambiguedad = fallo**: si dos capas compiten por ser figura, el usuario duda.
- **Profundidad**: la sombra, el desenfoque y la escala son las herramientas para asignar capa. Usalas de forma consistente.

## 7. Efecto Von Restorff — lo que se sale es lo que se recuerda

El elemento que difiere de sus vecinos es el que se nota y el que se recuerda. La homogeneidad visual es la base; la desviacion atrae el ojo.

**El efecto depende del contraste con el contexto. Si todo destaca, no destaca nada.** Solo funciona cuando:
- Uno (o muy pocos) elementos se desvian.
- Los elementos de alrededor son visualmente consistentes entre si.
- La desviacion tiene significado, no es decorativa.

| Contexto | Como aplicarlo |
|---|---|
| Llamada a la accion | Un unico boton relleno; los demas fantasma o de texto |
| Precios | Destaca un unico plan recomendado; baja el peso visual de los demas |
| Navegacion | El estado activo claramente distinto del inactivo |
| Tablas | Resalte de fila o negrita para el registro clave |

**Diagnostico**: cuenta cuantos elementos de la pantalla piden atencion. Si son mas de dos, ninguno la tiene.

## 8. Jerarquia visual — el orden en el que aterriza el ojo

Las seis herramientas, en orden de fuerza:

- **Tamano**: lo grande se ve primero. Para una distincion clara, diferencias de al menos 1,5x.
- **Peso**: la negrita, los trazos gruesos y los iconos rellenos pesan mas que sus variantes ligeras.
- **Color y contraste**: el alto contraste atrae. Usa el color de forma estrategica para CTA, estado y enfasis.
- **Espaciado**: mas aire alrededor de un elemento aumenta su importancia percibida.
- **Posicion**: arriba a la izquierda (en lectura de izquierda a derecha) se ve primero. Sobre el pliegue importa. Patrones de barrido en F y en Z.
- **Densidad**: lo aislado destaca; lo agrupado se barre como una unidad.

Tres niveles, no mas:

1. **Primario**: titulo de pagina, CTA principal. Se ve primero.
2. **Secundario**: cabeceras de seccion, contenido clave. Se barre despues.
3. **Terciario**: texto de apoyo, metadatos. Se lee bajo demanda.

**La prueba de entrecerrar los ojos**: entorna la vista hasta que la pantalla se desenfoque. Lo que sigues distinguiendo es tu jerarquia real. Si no coincide con la que pretendias, el problema es de tamano, peso o contraste, no de contenido.

---

## Como usar este paquete

**Al componer**: decide primero la agrupacion (proximidad, luego region comun si hace falta), luego el orden de lectura (continuidad y jerarquia), luego el enfasis (Von Restorff, uno solo) y por ultimo la profundidad (figura-fondo).

**Al diagnosticar**, en este orden:

1. Entorna los ojos: se ve la jerarquia pretendida? Si no, arregla tamano, peso y contraste.
2. Cuenta los elementos que piden atencion. Mas de dos, reduce.
3. Mide el espacio entre grupos frente al espacio dentro de ellos. Si no hay al menos el doble, la agrupacion es ruido.
4. Busca bordes sueltos que rompan la alineacion sin querer decir nada.
5. Busca bordes y separadores que el espacio ya sostiene. Borralos.
6. Comprueba que en cada capa esta claro que es figura y que es fondo.
