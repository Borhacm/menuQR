# Auditoria integral del Admin (Menuly)

Fecha: 2026-04-30
Alcance: panel `/app` (modulos, server actions, APIs admin y controles de auth/tenant/permisos)
Enfoque: diagnostico rapido 360 + profundidad en riesgos criticos

## 1) Inventario de modulos y cobertura

### Shell y control de acceso
- Layout protegido por `requireTenantContext()` en `src/app/(app)/app/layout.tsx`.
- Resolucion de tenant por cookie `menuly_org` + fallback a primera membresia en `src/lib/auth/tenant.ts`.
- Subdominios/app host resueltos en `src/middleware.ts`.

### Modulos funcionales del admin
- Dashboard: `src/app/(app)/app/page.tsx`
- Catalogo (menus/categorias/items/traducciones): `src/app/(app)/app/items/page.tsx`
- Templates y preview: `src/app/(app)/app/templates/page.tsx`
- QR y branding/export: `src/app/(app)/app/qr/page.tsx` + `src/app/api/qr/export/route.ts`
- Billing: `src/app/(app)/app/billing/page.tsx` + Stripe APIs
- Team: `src/app/(app)/app/team/page.tsx` + invitaciones/aceptacion
- Settings: `src/app/(app)/app/settings/page.tsx`

### Rutas alias/redirect legacy
- `src/app/(app)/app/menus/page.tsx` -> `/app/items`
- `src/app/(app)/app/translations/page.tsx` -> `/app/items?tab=translations`
- `src/app/(app)/app/analytics/page.tsx` -> `/app`

## 2) Matriz de endpoints admin (auth/tenant/rol/protecciones)

| Endpoint | Auth | Tenant isolation | Rol | Rate limit | Riesgo principal |
|---|---|---|---|---|---|
| `POST /api/team/invite` | Si (`auth`) | Indirecto (via server action) | No homogeneo (invitar sin OWNER) | Si | Escalada funcional de permisos |
| `POST /api/team/accept` | Si (`auth`) | Si (membresia por `organizationId`) | N/A (token+email) | Si | Sin proteccion CSRF explicita |
| `POST /api/tenant/select` | Si (`auth`) | Si (`setTenantCookieForUser`) | N/A | No | Sin CSRF/origin check |
| `GET /api/qr/export` | Si (`auth`) | Parcial (resource validado) | N/A | No | `designId` no acotado por `resourceId` |
| `POST /api/uploads` | Si (`auth`) | N/A | N/A | Si | Persistencia local en `public/uploads` |
| `POST /api/stripe/checkout` | Si (`auth`) | Si (tenant resuelto) | N/A | No | Dependencia en `NEXT_PUBLIC_APP_URL` |
| `POST /api/stripe/portal` | Si (`auth`) | Si (tenant resuelto) | N/A | No | Sin CSRF/origin check |
| `GET /api/internal/metrics` | Token opcional | N/A | N/A | No | Queda abierto si falta `METRICS_TOKEN` |
| `GET /api/internal/metrics/prometheus` | Token opcional | N/A | N/A | No | Mismo riesgo de exposicion accidental |

Nota: `POST /api/track` y `POST /api/newsletter` no son admin, pero impactan seguridad operativa (abuso/spam) y observabilidad.

## 3) Diagnostico rapido 360 por modulo

### Dashboard
- Bueno: usa contexto de tenant y limites por plan.
- Riesgo: agregaciones en memoria sobre eventos recientes; puede degradar con crecimiento.

### Catalogo (items/menus/traducciones)
- Bueno: muchas mutaciones validan ownership (`resourceId`) antes de escribir.
- Riesgo: `src/lib/admin/actions.ts` concentra demasiada logica critica en un solo archivo; alto acoplamiento/regresion.
- Riesgo tecnico: varias secuencias de writes sin transaccion explicita en flujos encadenados.

### Templates/preview
- Bueno: gating por plan aplicado en servidor (`canUseTemplates`), no solo en UI.
- Riesgo: consultas de preview + traducciones pueden escalar en costo.

### QR
- Bueno: `resourceId` se valida contra membresia del usuario.
- Riesgo critico: `designId` se busca por `findUnique({ id })` sin forzar que pertenezca al `resourceId` autorizado.

### Team
- Bueno: acciones sensibles (`removeMemberAction`, `resendInviteAction`, `updateMemberRoleAction`) validan OWNER.
- Riesgo: `inviteManagerAction` no exige OWNER; posible inconsistencia de politica de permisos.

### Settings
- Bueno: controles de input basicos, validacion de locales soportados.
- Riesgo: operaciones de seguridad dependen de flujos sin CSRF/origin hardening comun.

### Billing
- Bueno: validacion de plan y contexto tenant antes de checkout/portal.
- Riesgo: UX rota y callbacks incorrectos si `NEXT_PUBLIC_APP_URL` no esta bien configurada.

## 4) Hallazgos priorizados (impacto x esfuerzo)

### Alta severidad
1. **Posible fuga cross-tenant en export QR por `designId`**
   - Evidencia: `src/app/api/qr/export/route.ts` busca `qrDesign` por id sin `resourceId`.
   - Impacto: lectura/aplicacion de configuracion QR de otro tenant.
   - Esfuerzo: bajo (acotar query por `id + resourceId`).

2. **Proteccion de metrics interna depende de variable opcional**
   - Evidencia: `src/app/api/internal/metrics/route.ts` y `.../prometheus/route.ts` permiten acceso cuando no existe token.
   - Impacto: exposicion accidental de telemetria interna.
   - Esfuerzo: bajo (fail-closed en produccion).

3. **Falta de estrategia CSRF/origin uniforme en POST con cookies**
   - Evidencia: team/tenant/stripe/uploads aceptan POST sin validacion explicita de origen.
   - Impacto: riesgo de requests cruzadas en escenarios de navegador.
   - Esfuerzo: medio (helper comun de validacion de origin + rollout).

### Media severidad
4. **Politica de rol no homogena en invitaciones**
   - Evidencia: `inviteManagerAction` no valida OWNER, otras acciones de team si.
   - Impacto: expansion no deseada de capacidad para invitar.
   - Esfuerzo: bajo.

5. **Persistencia de uploads en filesystem local**
   - Evidencia: `src/app/api/uploads/route.ts` escribe en `public/uploads`.
   - Impacto: perdida de archivos en entornos efimeros/serverless.
   - Esfuerzo: medio (migrar a storage durable).

6. **Complejidad/acoplamiento en `actions.ts`**
   - Evidencia: archivo grande, multiples dominios (catalogo/team/template/qr/settings).
   - Impacto: regresiones y baja mantenibilidad.
   - Esfuerzo: medio-alto (refactor por modulos).

### Baja severidad
7. **Aliases legacy sin telemetria de uso**
   - Impacto: deuda de mantenimiento.
   - Esfuerzo: bajo.

8. **Eventos publicos sin anti-abuso dedicado (`/api/track`, `/api/newsletter`)**
   - Impacto: ruido de datos/spam.
   - Esfuerzo: bajo-medio.

## 5) Backlog priorizado con fixes propuestos

## Fase 1 (quick wins criticos, 1-2 dias)
1. Cerrar `designId` a tenant/resource en `GET /api/qr/export`.
   - Criterio de aceptacion: export falla 404/403 cuando `designId` no pertenece al resource del usuario.
2. Endurecer metrics internas (fail-closed en produccion).
   - Criterio: si entorno no local y falta token -> 401 siempre.
3. Unificar policy de rol para invitaciones.
   - Criterio: solo OWNER puede invitar (o policy definida explicitamente y testeada).
4. Agregar `secure` condicional a cookie de tenant.
   - Criterio: cookie `menuly_org` via HTTPS siempre con `Secure`.

## Fase 2 (fortalecimiento estructural, 2-4 dias)
1. Introducir helper comun de proteccion CSRF/origin para endpoints POST de admin.
2. Migrar uploads a almacenamiento durable (S3/Blob compatible) manteniendo validaciones de mime/firma.
3. Separar `src/lib/admin/actions.ts` por dominios:
   - `catalog-actions.ts`
   - `team-actions.ts`
   - `template-actions.ts`
   - `settings-actions.ts`
   - `qr-actions.ts`

## Fase 3 (observabilidad y performance, 2-3 dias)
1. Agregar limites anti-abuso a `/api/newsletter` y `/api/track` + eventos de auditoria.
2. Revisar consultas pesadas de dashboard/templates para reducir N+1 y payload.
3. Instrumentar alertas de seguridad operativa:
   - acceso metrics sin token
   - intentos de switch tenant invalidos
   - rechazo por CSRF/origin

## 6) Recomendaciones de testing para cerrar auditoria

### Seguridad
- Test de integracion para evitar `designId` cruzado entre tenants.
- Test para endpoints internos de metrics en `NODE_ENV=production` sin token.
- Test de permisos team para OWNER vs MANAGER.
- Test de origin/csrf en POST admin (caso valido e invalido).

### Funcional
- Smoke de flows: onboarding -> items -> templates -> qr export -> team invite -> billing.
- Pruebas de tenant switch en header y sidebar (consistencia de comportamiento).

### Tecnica
- Medir p95 de dashboard con dataset mediano/alto.
- Validar persistencia de media en entorno de despliegue real.

## 7) Resumen ejecutivo

El admin esta bien encaminado en autenticacion base y aislamiento por tenant en la mayoria de operaciones. Los principales riesgos a corregir de inmediato son: alcance de `designId` en export QR, cierre seguro de endpoints internos de metricas y homogeneidad de permisos/CSRF en endpoints POST. Con Fase 1 se reduce gran parte del riesgo de seguridad con esfuerzo bajo.
