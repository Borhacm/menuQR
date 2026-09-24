# Tests end-to-end

`golden-path.spec.ts` recorre el flujo completo de un restaurante: registro, secciones, platos,
traducciones, exportación del QR y menú público en móvil. Crea usuarios, así que **usa siempre una
base de datos desechable, nunca la de producción**.

## Base de datos local sin Docker (Postgres de Homebrew)

```bash
initdb -D /tmp/menuly-pg -U menuly --auth=trust
LC_ALL=en_US.UTF-8 pg_ctl -D /tmp/menuly-pg -o "-p 5434 -k /tmp" -l /tmp/menuly-pg.log start
createdb -h 127.0.0.1 -p 5434 -U menuly menuly_e2e
```

## Ejecutar

```bash
export DATABASE_URL="postgresql://menuly@127.0.0.1:5434/menuly_e2e?schema=public"
export AUTH_SECRET="local-e2e" AUTH_URL="http://localhost:3000" AUTH_TRUST_HOST=true
export NEXT_PUBLIC_APP_URL="http://localhost:3000" TRANSLATE_PROVIDER=suffix OPENAI_API_KEY=""
npx prisma migrate deploy && npm run db:seed
npx next build && npx next start -p 3000 &
npx playwright test
```

Usa `localhost`, no `127.0.0.1`: las rutas POST comparan el `Origin` con la URL que ve Next.
Si no quieres descargar navegadores, `PW_EXE=<ruta a chrome-headless-shell>` reutiliza uno ya instalado.
