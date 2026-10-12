# Instrucciones para agentes de VIVAIR

Estas instrucciones aplican a cualquier agente que lea, documente o modifique este repositorio, incluido V0. Antes de trabajar, lee este archivo, `README.md`, el issue asignado y los escenarios Gherkin relacionados.

## Contexto y acuerdos del proyecto

- VIVAIR es un proyecto experimental con alcance de MVP acotado. La prioridad es mantener una especificación precisa y el mínimo proceso necesario para construir y revisar el producto.
- V0 es la herramienta prevista para generar la aplicación y sus pruebas. Codex ayuda a definir y mantener los requisitos, la trazabilidad, la documentación y el flujo de trabajo. El código debe poder continuarse desde GitHub con otra herramienta si se agotan los límites o créditos disponibles en V0.
- GitHub es la fuente de verdad del código, los requisitos, los issues y las revisiones. No trates el estado efímero de un chat de V0 como requisito aprobado.
- `README.md` es la fuente de verdad de la visión, los roles, el alcance, las reglas de negocio, la arquitectura y las restricciones del MVP. Las historias de usuario y sus criterios de aceptación viven en `features/*.feature`, en inglés.
- Cada HU tiene un identificador estable `HU-###`, un issue de GitHub con el ID en el título y referencias a su archivo y escenarios Gherkin. El issue y Gherkin deben describir el mismo comportamiento.
- La documentación funcional del producto se mantiene en README y Gherkin. Este `AGENTS.md` contiene instrucciones para agentes y reglas de colaboración; no debe convertirse en una especificación duplicada del producto.

## Preparación obligatoria de ramas

Antes de **cualquier** cambio en el repositorio, incluidos README, Gherkin, CI o documentación:

1. Revisa `git status`, las ramas locales y sus upstreams. No empieces a editar sobre `main`, una rama marcada `[gone]` ni una rama de otro cambio.
2. Actualiza las referencias remotas con `git fetch --prune origin`. Si falla, no afirmes que el remoto está actualizado: inspecciona las referencias `origin/*` disponibles, informa la limitación y trabaja solo si hay una base remota conocida y apropiada.
3. Conserva cualquier trabajo pendiente antes de cambiar de rama. Nunca lo descartes para resolver un conflicto de rama.
4. Crea una rama local nueva, descriptiva y basada en el `origin/main` actualizado. Usa `feature/hu-###-<slug>` para implementar una HU; usa prefijos como `docs/<slug>`, `fix/<slug>` o `chore/<slug>` para otros cambios. No reutilices ramas de PR anteriores.
5. Confirma que la rama nueva parte de `origin/main` y que el árbol de trabajo contiene únicamente el trabajo de esta tarea.

Después de preservar cualquier trabajo pendiente y confirmar que las referencias remotas identifican la base, elimina las ramas locales cuyo upstream ya no existe (marcadas `[gone]`). Antes de borrar una rama, comprueba si contiene commits o cambios únicos que deban preservarse; conserva esos cambios en la rama nueva cuando sigan siendo necesarios. No mantengas ramas locales obsoletas como base de trabajo.

Cuando `main` local esté limpio y sea antecesor de `origin/main`, puede adelantarse por fast-forward para que también quede actualizado. No hagas merge de ramas de trabajo hacia `main` local.

## Flujo de una historia de usuario

1. Parte de un issue de GitHub existente. Lee el issue completo y todos los escenarios `@HU-###` de los archivos `.feature` asociados.
2. Trabaja una HU por conversación de implementación, rama y PR. Solo agrupa HU si tienen una dependencia funcional directa; en ese caso, declara todos los IDs e issues y conserva la trazabilidad de cada escenario.
3. Si faltan datos, los escenarios se contradicen o no determinan un resultado observable, no inventes requisitos. Expón la pregunta y solicita que el issue o Gherkin se aclare antes de implementar el comportamiento afectado.
4. Implementa solo el alcance del issue y satisface los escenarios sin alterar su significado. No agregues funcionalidades, reglas, roles, pantallas o dependencias no aprobadas.
5. Añade o actualiza pruebas unitarias para las reglas y límites implementados. Usa datos sintéticos y no introduzcas credenciales, secretos, datos personales reales o información de pago.
6. Revisa el diff, resume el comportamiento implementado y las validaciones realizadas, y entrega los cambios en la rama de trabajo.

## Instrucciones específicas para V0

- Al iniciar cada tarea, indica el ID de la HU, el número de issue, la rama nueva y los escenarios que debe satisfacer.
- Conecta V0 al repositorio `dsramireza/VIVAIR` y confirma que la rama base sea `main` actualizado. Si se continúa una rama en otro chat de V0, verifica que sea la rama de la HU actual y no una rama de trabajo ya integrada.
- Pide a V0 que lea `AGENTS.md`, `README.md`, el issue y los archivos Gherkin vinculados antes de editar.
- V0 puede crear commits y sincronizarlos con la rama de la HU. Un miembro del equipo abre manualmente el PR hacia `main` desde GitHub.
- No uses **Publish** de V0 para integrar cambios ni para hacer merge. El PR, su revisión y el merge son pasos manuales en GitHub.
- No crees ramas permanentes `development` o `test`. Las ramas de feature y los Previews de Vercel cubren el trabajo y la revisión previa al merge.
- Si una HU requiere cambios de base de datos, incluye migraciones reproducibles y versionadas en GitHub. V0 puede ayudar a generar SQL y configurar la conexión, pero el equipo conserva el control de las cuentas, los proyectos, los requisitos, la seguridad y la revisión del esquema.

## Producto y arquitectura

- Sigue el alcance, roles y reglas completos que están en `README.md`. Entre las restricciones principales están la interfaz en español, ciudades y asientos de catálogo fijo, importes en COP, horas en `America/Bogota`, pago simulado, datos sintéticos y separación entre pasajero y administrador.
- La arquitectura acordada es Next.js, TypeScript, Tailwind CSS y shadcn/ui, con Supabase PostgreSQL y Supabase Auth. Vercel aloja la aplicación.
- La autorización debe protegerse en servidor y base de datos. No confíes en restricciones del cliente; el rol administrador no puede asignarse desde el cliente.
- Hay dos proyectos gratuitos de Supabase para separar Preview/pruebas y demo. No pongas secretos en el repositorio; usa variables de entorno configuradas por entorno.
- No fijes en código supuestos sobre límites cambiantes de los planes gratuitos. Consulta la configuración y documentación vigente cuando una decisión dependa de cuotas o disponibilidad.

## Gherkin, issues y trazabilidad

- Escribe los `.feature` en inglés y usa sintaxis Gherkin válida. Cada escenario debe describir una conducta observable, con precondiciones, datos, acción y resultados verificables.
- Evita términos subjetivos, estados implícitos, resultados no medibles y dependencias tácitas entre escenarios. Mantén escenarios independientes y asignados a una sola HU cuando sea posible.
- Valida sintaxis con el validador Gherkin configurado y revisa semánticamente la precisión antes de publicar requisitos.
- El tablero GitHub Projects `VIVAIR MVP` usa `Backlog`, `Ready`, `In progress`, `In review` y `Done`; la automatización agrega issues abiertos del repositorio. Cada issue debe conservar el enlace a los escenarios de su HU.
- En el PR enlaza el issue con `Closes #<número>` cuando corresponda. No cierres ni cambies el estado de una HU sin evidencia de que sus criterios se integraron.

## Pull requests, CI y despliegues

- El flujo es `rama de trabajo → PR hacia main → revisión manual → merge manual`. No uses ramas compartidas permanentes ni mezcles HU independientes en un mismo PR.
- El repositorio define `PR Gate` para todos los PR hacia `main`, sin filtrar el evento por rutas. Los cambios solo de README/Markdown, Gherkin y `.github/` reciben validación documental; los cambios de aplicación ejecutan los scripts disponibles de lint, revisión de tipos y pruebas unitarias.
- Los cambios de aplicación requieren `package.json` y un lockfile versionado. Si existen archivos de pruebas unitarias pero no hay script `test:unit` o `test`, el gate debe fallar; si todavía no hay suite ni archivos, el gate puede omitir unit tests.
- Vercel ejecuta Preview para cambios de código y Production para cambios integrados en `main`. Para PR con código, Preview y `PR Gate` se ejecutan en paralelo; ambos deben terminar correctamente y el equipo debe revisar el Preview antes del merge.
- `.github/scripts/ignore-vercel-build.sh` omite builds para cambios exclusivamente documentales o de configuración GitHub. No elimines ni debilites esta clasificación sin una razón documentada.
- La política acordada es que el check `PR Gate` sea obligatorio en `main`; verifica la configuración real de protección en GitHub antes de afirmar que está activa. La conversación no estableció una regla definitiva de aprobación exclusiva de una persona.
- Al revisar un PR que implementa HU, comprueba que la descripción incluya `Closes #<número>` para cada issue cubierto y que los escenarios de esos issues tengan evidencia de validación. Después del merge, confirma en GitHub que todos quedaron cerrados y que su estado en el proyecto refleja la integración; si alguno sigue abierto, investiga la causa antes de cambiarlo manualmente.
- GitHub tiene activada la eliminación automática de la rama origen después de integrar el PR. Cada siguiente cambio empieza desde una rama nueva basada en `main` actualizado.
- No hagas push forzado, no sobrescribas ramas compartidas y no reutilices una rama cuyo PR ya se integró mediante squash. La historia integrada vive en `main`; los cambios posteriores se publican desde una rama nueva.

## Validación y entrega

- Para cambios documentales, valida formato y enlaces relevantes; si se modifican `.feature`, valida Gherkin.
- Para cambios de aplicación, ejecuta los scripts configurados de lint, tipos y pruebas unitarias, además de las validaciones necesarias para el cambio. Reporta cada validación que no pudo ejecutarse; nunca afirmes un resultado no comprobado.
- Antes de entregar, revisa `git diff`, `git status` y el nombre/upstream de la rama. Resume archivos afectados, criterios cubiertos, verificaciones y limitaciones.
- No abras, integres ni publiques un PR sin autorización explícita del usuario. Deja la rama y los cambios listos para revisión cuando ese sea el alcance pedido.
