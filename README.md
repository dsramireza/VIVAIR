# VIVAIR

VIVAIR es un prototipo web para demostrar el funcionamiento básico de una aerolínea: pasajeros buscan vuelos nacionales, reservan asientos con un pago simulado y administración publica vuelos y consulta ventas.

GitHub es la fuente de verdad del código y de los requisitos. V0 genera la aplicación y sus pruebas; Codex mantiene la especificación, la trazabilidad y la revisión. El código debe poder continuarse desde GitHub con otra herramienta si se agotan los límites gratuitos de V0.

## Roles

### Pasajero

- Crea una cuenta con nombre, correo y contraseña, e inicia sesión. La demo no requiere confirmar el correo.
- Busca vuelos de solo ida entre ciudades colombianas del catálogo fijo y consulta vuelos publicados para fechas futuras.
- Reserva para una a cuatro personas. Cada pasajero tiene nombre legal, tipo y número de documento, y un asiento asignado.
- Consulta y cancela la reserva completa antes de la salida programada. La cancelación libera todos sus asientos; no hay reembolso real.
- Recibe en su cuenta avisos cuando administración modifica un vuelo reservado.

### Administrador

- Usa una cuenta preparada fuera del registro público. El registro público siempre crea pasajeros y no permite elevar privilegios.
- Crea, edita, publica, retira de venta y vuelve a publicar vuelos futuros.
- Cambia ruta u horario de vuelos con reservas; las reservas confirmadas muestran los datos nuevos y reciben un aviso interno.
- Consulta conteo de reservas confirmadas, asientos vendidos e ingresos simulados en COP.

## Alcance del MVP

### Incluido

- Aplicación web adaptable a escritorio y móvil, con interfaz en español.
- Vuelos de solo ida entre estas ciudades: Bogotá, Medellín, Cali, Cartagena y Barranquilla. La búsqueda requiere origen, destino y fecha local.
- Vuelos con hora de salida local, tarifa base positiva en COP y un mapa fijo de 20 asientos: filas 1–2 son Plus; filas 3–5 son Estándar; cada fila tiene asientos A–D.
- Tarifa por pasajero igual a la tarifa base del vuelo más el recargo de categoría. Estándar agrega COP 0; Plus agrega COP 50.000. Son valores ficticios de demostración, configurados globalmente y no editables por vuelo.
- Política ficticia de equipaje visible antes de pagar: Estándar incluye un artículo personal; Plus incluye un artículo personal y un equipaje de cabina de hasta 10 kg. No se vende equipaje adicional.
- Pago mock con selector de resultado aprobado o rechazado, sin capturar datos de tarjeta. Solo un resultado aprobado crea la reserva y ocupa asientos.
- Código único de reserva y gestión de reservas propias. La cancelación de una reserva completa solo se permite cuando la hora actual en `America/Bogota` es anterior a la salida programada.
- Avisos internos persistentes para pasajeros afectados por cambios de ruta u horario.
- Tablero administrativo sin filtros: reservas confirmadas no canceladas, pasajeros/asientos confirmados no cancelados e importe total COP de dichas reservas. Una cancelación excluye la reserva, sus pasajeros y su importe de estos tres totales.

### Fuera del alcance

- Ida y regreso, conexiones, check-in, pase de abordar, promociones, puntos y compra de equipaje.
- Pasarela de pago, reembolsos, correo o notificaciones externas reales.
- Catálogo editable de ciudades, configuración de aeronaves, modificación de capacidad/mapa de asientos, operación en tiempo real y sistemas aeroportuarios.
- SLA comercial de rendimiento o disponibilidad.

## Reglas de operación

- Las horas se interpretan y presentan en `America/Bogota`; importes se presentan en COP con formato colombiano.
- Todo vuelo inicia como `Draft`; solo vuelos `Published` con salida futura aparecen en búsqueda. Origen y destino deben ser distintos y pertenecer al catálogo fijo. La tarifa base debe ser mayor que COP 0.
- Retirar un vuelo impide nuevas compras. Si tiene cualquier reserva —incluso cancelada— se conserva y no puede borrarse físicamente. Solo se puede borrar un vuelo que nunca tuvo reservas. Un vuelo retirado puede volver a publicarse si su salida sigue en el futuro.
- Un asiento se asigna a una sola reserva confirmada por vuelo. La disponibilidad se valida de nuevo al aprobar el pago; si otro usuario ocupó el asiento, no se crea la reserva.
- Un pago rechazado no crea reserva ni bloquea asientos. El importe confirmado queda congelado en la reserva aunque cambie la tarifa del vuelo.
- Solo se puede cambiar la ruta o la hora de un vuelo cuya salida todavía sea futura; la nueva salida también debe ser futura. Las reservas confirmadas no canceladas reflejan los nuevos datos y reciben un aviso que muestra los valores anteriores y nuevos. Las reservas canceladas conservan los datos del vuelo que tenían al cancelarse.
- La capacidad y el mapa son fijos: 20 asientos por vuelo. No existe una operación para reducir capacidad.
- El pasajero solo puede consultar y cancelar sus propias reservas. El administrador puede gestionar vuelos y ver métricas, pero no obtiene una vista de datos personales de pasajeros.
- Las pruebas y la demo usan datos sintéticos; no se guardan datos de pago reales.

## Arquitectura y colaboración

- **Aplicación:** Next.js, TypeScript, Tailwind CSS y shadcn/ui.
- **Datos y autenticación:** Supabase PostgreSQL y Supabase Auth. La autorización debe protegerse en servidor y base de datos; el rol de administrador no puede modificarse desde el cliente.
- **Despliegue:** Vercel. Se usan dos proyectos Supabase gratuitos, uno para pruebas/preview y otro para demo.
- **Flujo:** V0 trabaja en ramas; los cambios se integran mediante pull request. GitHub Actions valida las pruebas automatizadas críticas en cada pull request.
- **Límites vigentes consultados el 7 de octubre de 2026:** V0 Free indica USD 5 de créditos mensuales, 7 mensajes al día, sincronización con GitHub y despliegue en Vercel. V0 usa Next.js por defecto para aplicaciones full-stack. [Precios de V0](https://api2.v0.dev/pricing) · [Documentación full-stack de V0](https://v0.dev/docs/full-stack-apps)
- Supabase Free permite dos proyectos activos y pausa proyectos tras una semana de inactividad. [Precios de Supabase](https://supabase.com/pricing)

## Especificación, trazabilidad y validación

- Las HU viven únicamente en archivos Gherkin `.feature` escritos en inglés. README es el único documento explicativo del proyecto.
- Cada HU tiene un ID estable `HU-###`, un issue de GitHub con el mismo ID en el título y referencias al archivo y a los escenarios Gherkin correspondientes.
- Cada escenario debe expresar una sola conducta observable con precondiciones, datos, acción, resultado y límites verificables. Se prohíben términos subjetivos, estados implícitos, expectativas no medibles y dependencias tácitas entre escenarios.
- Antes de publicar una HU se valida la sintaxis con un parser Gherkin y se realiza revisión semántica de ambigüedades. Las pruebas automatizadas críticas se ejecutan en cada pull request.

## Seguimiento de issues

- El tablero de GitHub Projects usa los estados `Backlog`, `Ready`, `In progress`, `In review` y `Done`.
- Cada issue de HU enlaza a su archivo y escenario Gherkin; el pull request de implementación enlaza el issue con `Closes #<number>`.
- La automatización agrega cada issue nueva al tablero. Los pull requests enlazan el issue con `Closes #<number>` para que GitHub lo cierre al integrar el cambio.
