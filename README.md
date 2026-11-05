# Magic Card Store

[![CI](https://github.com/JavierMoyaSimo/magic-card-store/actions/workflows/ci.yml/badge.svg)](https://github.com/JavierMoyaSimo/magic-card-store/actions/workflows/ci.yml)

Una aplicación web full-stack para gestionar una tienda online de cartas de _Magic: The Gathering_, inspirada en CardMarket. Escribe el nombre de una carta o sube una fotografía de ella y la aplicación obtiene automáticamente sus datos e imagen oficiales.

## Demo en vivo

**https://magic-card-store-1.onrender.com**

El catálogo es público y se puede consultar sin iniciar sesión. Para probar el resto de funcionalidades, puedes crear una cuenta de cliente desde la propia web.

> La aplicación está alojada en el plan gratuito de Render: si nadie la ha usado en los últimos 15 minutos, el servidor se duerme y la primera carga puede tardar alrededor de un minuto en responder.

## Capturas de pantalla

![Catálogo público de la tienda](docs/screenshot0.png)

![Inicio de sesión y registro](docs/screenshot1.png)

![Panel de administración para añadir cartas](docs/screenshot2.png)

![Edición y gestión de cartas](docs/screenshot3.png)

## Funcionalidades

- Catálogo público: cualquier visitante puede consultar y buscar las cartas de la tienda.
- Cuentas de usuario con registro e inicio de sesión (autenticación con JWT y contraseñas cifradas con bcrypt).
- Control de acceso por roles: solo los administradores pueden gestionar las cartas y usar las funciones que consultan APIs externas.
- Limitación de intentos (_rate limiting_) en los endpoints de registro e inicio de sesión.
- Añadir cartas a la tienda por nombre, con sugerencias de autocompletado mientras escribes.
- **Añadir cartas mediante una fotografía**: la API de Claude (visión) identifica el nombre de la carta y Scryfall proporciona sus datos oficiales.
- Obtener automáticamente los datos e imágenes de las cartas mediante la [API de Scryfall](https://scryfall.com/docs/api).
- Búsqueda tolerante a errores tipográficos: por ejemplo, "light bolt" encuentra _Lightning Bolt_.
- Datos específicos de cada carta en la tienda: precio, stock y estado de conservación (NM, LP, MP, HP, DMG).
- Buscar cartas en la tienda por nombre.
- Editar el precio, el stock y el estado de conservación, así como eliminar cartas.
- Protección contra duplicados: no se puede añadir dos veces la misma carta.
- Pruebas automatizadas e integración continua mediante GitHub Actions.
- Aplicación desplegada en internet (frontend y backend en Render, base de datos en MongoDB Atlas).
- Seguridad adicional: cabeceras HTTP de protección con Helmet y límite de uso por usuario en la identificación mediante fotografías, que consume saldo de la API de Claude.

## Autenticación y roles

- Los usuarios se registran con email y contraseña. De la contraseña solo se guarda un hash generado con bcrypt, nunca el texto original.
- Al iniciar sesión, el servidor devuelve un JWT firmado que caduca a los 7 días. La web lo envía en la cabecera `Authorization: Bearer <token>`.
- Existen dos roles: `customer` (el que recibe cualquier cuenta nueva) y `admin`. El rol **no se puede elegir al registrarse**: la única forma de crear un administrador es el script `make-admin`, que se ejecuta en el servidor.
- Las rutas protegidas pasan por dos middlewares: `requireAuth` (responde `401` si no hay una sesión válida) y `requireAdmin` (responde `403` si el usuario no es administrador).
- Los endpoints de registro e inicio de sesión permiten un máximo de 30 intentos cada 15 minutos por dirección IP.

## Cómo funciona la identificación mediante fotografías

1. El administrador sube la fotografía desde el navegador al backend (nunca directamente a la API de IA, para mantener privada la clave de acceso).
2. El backend comprueba la sesión y el rol, valida el archivo (únicamente imágenes, con un tamaño máximo de 5 MB) y lo envía a Claude junto con una instrucción para obtener exclusivamente el nombre de la carta en formato JSON.
3. El nombre devuelto se consulta en Scryfall para obtener los datos oficiales de la carta.
4. El formulario se completa automáticamente y el usuario **revisa el resultado** antes de guardarlo, ya que el reconocimiento mediante IA puede cometer errores.

## Tecnologías utilizadas

| Capa                           | Tecnología                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| Frontend                       | React, Vite                                                                           |
| Backend                        | Node.js, Express, Multer                                                              |
| Base de datos                  | MongoDB Atlas, Mongoose                                                               |
| Autenticación y seguridad      | JSON Web Tokens (`jsonwebtoken`), bcrypt (`bcryptjs`), `express-rate-limit`, `helmet` |
| APIs externas                  | Scryfall (datos de cartas), Claude API (reconocimiento de imágenes)                   |
| Pruebas e integración continua | `node:test`, Supertest, GitHub Actions                                                |
| Despliegue                     | Render (Web Service y Static Site), MongoDB Atlas                                     |

## Estructura del proyecto

```text
magic-card-store/
├── .github/workflows/   # Flujo de integración continua (CI)
├── backend/
│   ├── src/
│   │   ├── middleware/  # Autenticación y control de roles (requireAuth, requireAdmin)
│   │   ├── models/      # Esquemas de Mongoose (Card, User)
│   │   ├── services/    # Clientes de las APIs de Scryfall y Claude
│   │   ├── routes/      # Rutas de Express (cartas, Scryfall, identificación, autenticación)
│   │   ├── scripts/     # Scripts de administración (make-admin)
│   │   ├── app.js       # Aplicación Express (middlewares, CORS y rutas)
│   │   └── index.js     # Punto de entrada del servidor (conexión a la base de datos)
│   └── tests/           # Pruebas de la API
├── frontend/
│   └── src/
│       ├── auth/        # Contexto de autenticación (AuthProvider, useAuth)
│       ├── components/  # AddCardForm, AuthPanel, CardList, CardItem
│       ├── api.js       # Construcción de la URL de la API (VITE_API_URL)
│       └── App.jsx
└── docs/                # Capturas de pantalla
```

## Endpoints de la API

| Método | Endpoint                        | Acceso        | Descripción                                                                          |
| ------ | ------------------------------- | ------------- | ------------------------------------------------------------------------------------ |
| GET    | `/api/health`                   | Público       | Comprobar el estado del servidor                                                     |
| POST   | `/api/auth/register`            | Público       | Crear una cuenta de cliente (`email`, `password`)                                    |
| POST   | `/api/auth/login`               | Público       | Iniciar sesión y recibir un JWT                                                      |
| GET    | `/api/auth/me`                  | Sesión        | Obtener el usuario asociado al token                                                 |
| GET    | `/api/cards?search=`            | Público       | Obtener las cartas de la tienda, con filtro opcional por nombre                      |
| GET    | `/api/cards/:id`                | Público       | Obtener una carta concreta                                                           |
| POST   | `/api/cards`                    | Administrador | Añadir una carta (`name`, `price`, `stock`, `condition`)                             |
| PUT    | `/api/cards/:id`                | Administrador | Actualizar el `price`, `stock` o `condition`                                         |
| DELETE | `/api/cards/:id`                | Administrador | Eliminar una carta                                                                   |
| GET    | `/api/scryfall/autocomplete?q=` | Administrador | Obtener sugerencias de nombres de cartas                                             |
| GET    | `/api/scryfall/search?name=`    | Administrador | Buscar una carta por nombre (búsqueda aproximada)                                    |
| POST   | `/api/identify`                 | Administrador | Identificar una carta mediante una fotografía (`multipart/form-data`, campo `image`) |

## Puesta en marcha

### Requisitos previos

- [Node.js](https://nodejs.org/) (versión LTS).
- Un clúster gratuito de [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), con un usuario de base de datos creado y tu dirección IP autorizada en _Network Access_.
- Una clave API de Anthropic, disponible en [Claude Console](https://platform.claude.com/) (solo necesaria para la funcionalidad de identificación mediante fotografías).

### Instalación

```bash
git clone https://github.com/JavierMoyaSimo/magic-card-store.git
cd magic-card-store
npm install
npm run install:all
cp backend/.env.example backend/.env   # Después, edita backend/.env con tus propios valores
npm run dev
```

La API estará disponible en `http://localhost:5000` y la aplicación en `http://localhost:5173`. En desarrollo, Vite redirige las peticiones a `/api` hacia el backend.

### Variables de entorno

**Backend** (`backend/.env`):

| Variable            | Descripción                                                                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`       | Cadena de conexión de MongoDB Atlas, incluyendo el nombre de la base de datos (`magic-store-dev` en desarrollo y `magic-store` en producción) |
| `JWT_SECRET`        | Cadena larga y aleatoria utilizada para firmar los tokens de autenticación (obligatoria)                                                      |
| `ANTHROPIC_API_KEY` | Clave API de Claude, utilizada para la funcionalidad de identificación mediante fotografías                                                   |
| `FRONTEND_URL`      | Dirección o direcciones (separadas por comas) desde las que se permite llamar a la API (CORS)                                                 |
| `NODE_ENV`          | `production` en el entorno desplegado; activa la confianza en el proxy para detectar la IP del visitante                                      |
| `PORT`              | Puerto del backend (por defecto, `5000`). En Render lo asigna la propia plataforma                                                            |
| `CLAUDE_MODEL`      | Opcional. Modelo de Claude utilizado para identificar las cartas (por defecto, `claude-haiku-5-5`)                                            |

**Frontend** (`frontend/.env`, opcional en desarrollo):

| Variable       | Descripción                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------- |
| `VITE_API_URL` | Dirección pública del backend. En desarrollo se deja vacía y Vite redirige `/api` al servidor |

Para generar un valor seguro de `JWT_SECRET`:

```bash
node -p "require('node:crypto').randomBytes(48).toString('hex')"
```

### Crear la cuenta de administrador

Toda cuenta nueva se crea con el rol `customer`. Para gestionar la tienda:

1. Regístrate desde la aplicación web.
2. Convierte tu cuenta en administradora desde la carpeta `backend`:

```bash
npm run make-admin -- tu@email.com
```

3. Cierra sesión y vuelve a iniciarla para que se aplique el nuevo rol.

### Ejecución de las pruebas

```bash
npm test
```

Las pruebas comprueban los permisos (respuestas `401` y `403`) y las validaciones de la API, y no necesitan una base de datos ni claves API. También se ejecutan automáticamente en cada `push` mediante GitHub Actions.

## Despliegue

La aplicación se compone de tres piezas independientes:

| Pieza         | Plataforma                    | Configuración                                                                                |
| ------------- | ----------------------------- | -------------------------------------------------------------------------------------------- |
| Base de datos | MongoDB Atlas (plan gratuito) | Usuario con permisos `readWrite` solo sobre la base de datos de la tienda                    |
| Backend       | Render, _Web Service_         | Root Directory `backend`, Build `npm install`, Start `npm start`, Health Check `/api/health` |
| Frontend      | Render, _Static Site_         | Root Directory `frontend`, Build `npm install && npm run build`, Publish Directory `dist`    |

Pasos resumidos:

1. **Atlas**: crear un usuario de base de datos específico para producción y permitir el acceso desde cualquier IP en _Network Access_ (el servidor de Render no tiene una IP fija; la protección recae en el usuario y la contraseña).
2. **Backend**: crear el _Web Service_ con las variables `NODE_ENV=production`, `NODE_VERSION`, `MONGODB_URI`, `JWT_SECRET`, `ANTHROPIC_API_KEY` y `FRONTEND_URL` (con la dirección del frontend). Los valores de producción deben ser distintos a los de desarrollo.
3. **Frontend**: crear el _Static Site_ con `VITE_API_URL` (con la dirección del backend) y `NODE_VERSION`. Esta variable se incorpora al construir la web, por lo que, si cambia, hay que volver a desplegar.
4. Comprobar que el backend responde en `/api/health` y que las peticiones del frontend no se bloquean por CORS.

Notas del plan gratuito de Render:

- El backend se duerme tras 15 minutos sin tráfico y tarda alrededor de un minuto en volver a arrancar.
- El sistema de archivos es efímero. No afecta a esta aplicación: las fotografías se procesan en memoria y todos los datos se guardan en Atlas.

## Notas de seguridad

- **Protección en el servidor**: la web oculta los controles de administración por comodidad, pero la protección real está en el backend, que comprueba el token y el rol en cada petición.
- **CORS restringido**: el backend solo acepta peticiones del navegador desde las direcciones indicadas en `FRONTEND_URL`.
- **Almacenamiento del token**: el JWT se guarda en `localStorage`, lo que es sencillo pero lo expone si un atacante logra ejecutar código en la página (XSS). La alternativa más segura serían las cookies `httpOnly`.
- **Validez del token**: el token se valida únicamente por su firma y caducidad, por lo que un cambio de rol surte efecto cuando el usuario vuelve a iniciar sesión o el token caduca.
- **Secretos**: el archivo `.env` está excluido del repositorio. Las plantillas `.env.example` indican las variables necesarias sin incluir valores reales.
- **Cabeceras HTTP**: el backend usa Helmet para añadir cabeceras de seguridad y ocultar que funciona con Express.
- **Control del gasto**: la identificación mediante fotografías está limitada a 30 peticiones por hora y usuario, y solo pueden usarla los administradores. Los contadores se guardan en memoria y se reinician con el servidor.

## Solución de problemas

- **Error `querySrv ECONNREFUSED` al conectar con MongoDB**: algunas redes bloquean las consultas DNS SRV utilizadas por las URL `mongodb+srv://`. El backend configura servidores DNS públicos (Google y Cloudflare) en `src/index.js` para solucionar este problema.
- **Tiempo de espera de conexión agotado**: comprueba que tu dirección IP actual esté autorizada en Atlas, dentro de _Network Access_.
- **El servidor se detiene con el mensaje "Falta JWT_SECRET"**: añade la variable `JWT_SECRET` a `backend/.env` y reinicia el backend.
- **Tras ejecutar `make-admin` no aparecen los controles de administración**: cierra sesión y vuelve a iniciarla, ya que el rol viaja dentro del token.
- **La identificación mediante fotografías falla con un error de autenticación**: comprueba que `ANTHROPIC_API_KEY` esté configurada en `backend/.env` y reinicia el backend.
- **Los comandos `curl` fallan en PowerShell**: en PowerShell `curl` es un alias de otro comando. Usa Git Bash o `Invoke-RestMethod`.
- **Error de CORS en la aplicación desplegada**: comprueba que `FRONTEND_URL` coincide exactamente con la dirección del frontend (con `https://` y sin barra final) y que `VITE_API_URL` apunta a un backend que existe. Si el backend estaba dormido, el error puede aparecer como CORS aunque la configuración sea correcta; espera a que arranque y recarga.

## Próximas mejoras

- [x] Añadir cartas subiendo una fotografía, utilizando la API de Claude con capacidad de visión.
- [x] Pruebas automatizadas e integración continua.
- [x] Cuentas de usuario y autenticación (también necesarias para proteger el endpoint de pago de identificación mediante fotografías).
- [x] Limitación de solicitudes (Rate limiting) en los endpoints de autenticación.
- [x] Despliegue de la aplicación.
- [x] Base de datos separada para desarrollo y producción.
- [x] Refuerzo de seguridad (cabeceras HTTP con Helmet y límite de uso en el endpoint de identificación).
- [ ] Carrito de compra y gestión de pedidos.

## Créditos

Los datos e imágenes de las cartas son proporcionados por [Scryfall](https://scryfall.com). _Magic: The Gathering_ es una marca registrada de Wizards of the Coast. Este es un proyecto de fans no oficial y no está afiliado ni cuenta con el respaldo de Wizards of the Coast o Scryfall.

## Licencia

MIT
