# Magic Card Store

Una aplicación web full-stack para gestionar una tienda online de cartas de _Magic: The Gathering_, inspirada en CardMarket. Escribe el nombre de una carta, selecciónala entre las sugerencias del autocompletado y la aplicación obtiene automáticamente sus datos e imagen oficiales.

![Captura de pantalla de Magic Card Store](docs/screenshot.png)

## Funcionalidades

- Añadir cartas a la tienda por nombre, con sugerencias de autocompletado mientras escribes.
- Obtener automáticamente los datos e imágenes de las cartas mediante la [API de Scryfall](https://scryfall.com/docs/api).
- Búsqueda tolerante a errores tipográficos: por ejemplo, "light bolt" encuentra _Lightning Bolt_.
- Datos específicos de cada carta en la tienda: precio, stock y estado de conservación (NM, LP, MP, HP, DMG).
- Buscar cartas en la tienda por nombre.
- Editar el precio, el stock y el estado de conservación, así como eliminar cartas.
- Protección contra duplicados: no se puede añadir dos veces la misma carta.

## Tecnologías utilizadas

| Capa          | Tecnología              |
| ------------- | ----------------------- |
| Frontend      | React, Vite             |
| Backend       | Node.js, Express        |
| Base de datos | MongoDB Atlas, Mongoose |
| API externa   | Scryfall                |

## Estructura del proyecto

```text
magic-card-store/
├── backend/
│   └── src/
│       ├── models/      # Esquemas de Mongoose (Card)
│       ├── services/    # Cliente de la API de Scryfall
│       ├── routes/      # Rutas de Express
│       └── index.js     # Punto de entrada del servidor
├── frontend/
│   └── src/
│       ├── components/  # AddCardForm, CardList, CardItem
│       └── App.jsx
└── docs/
```

## Endpoints de la API

| Método | Endpoint                        | Descripción                                                     |
| ------ | ------------------------------- | --------------------------------------------------------------- |
| GET    | `/api/health`                   | Comprobar el estado del servidor                                |
| GET    | `/api/scryfall/autocomplete?q=` | Obtener sugerencias de nombres de cartas                        |
| GET    | `/api/scryfall/search?name=`    | Buscar una carta por nombre (búsqueda aproximada)               |
| GET    | `/api/cards?search=`            | Obtener las cartas de la tienda, con filtro opcional por nombre |
| GET    | `/api/cards/:id`                | Obtener una carta concreta                                      |
| POST   | `/api/cards`                    | Añadir una carta (`name`, `price`, `stock`, `condition`)        |
| PUT    | `/api/cards/:id`                | Actualizar el `price`, `stock` o `condition`                    |
| DELETE | `/api/cards/:id`                | Eliminar una carta                                              |

## Puesta en marcha

### Requisitos previos

- [Node.js](https://nodejs.org/) (versión LTS).
- Un clúster gratuito de [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), con un usuario de base de datos creado y tu dirección IP autorizada en _Network Access_.

### Instalación


```bash
git clone https://github.com/JavierMoyaSimo/magic-card-store.git
cd magic-card-store
npm install
npm run install:all
cp backend/.env.example backend/.env   # then edit backend/.env with your MongoDB connection string
npm run dev
```

La API correrá en `http://localhost:5000` y la aplicación en `http://localhost:5173`.

 Vite redirige las peticiones a `/api` hacia el backend.

### Variables de entorno

| Variable      | Descripción                                                                   |
| ------------- | ----------------------------------------------------------------------------- |
| `MONGODB_URI` | Cadena de conexión de MongoDB Atlas, incluyendo el nombre de la base de datos |
| `PORT`        | Puerto del backend (por defecto, `5000`)                                      |

## Solución de problemas

- **Error `querySrv ECONNREFUSED` al conectar con MongoDB**: algunas redes bloquean las consultas DNS SRV utilizadas por las URL `mongodb+srv://`. El backend configura servidores DNS públicos (Google y Cloudflare) en `src/index.js` para solucionar este problema.
- **Tiempo de espera de conexión agotado**: comprueba que tu dirección IP actual esté autorizada en Atlas, dentro de _Network Access_.

## Próximas mejoras

- [ ] Añadir cartas subiendo una fotografía, utilizando la API de Claude con capacidad de visión.
- [ ] Cuentas de usuario y autenticación.
- [ ] Carrito de compra y gestión de pedidos.
- [ ] Pruebas automatizadas.
- [ ] Despliegue de la aplicación.

## Créditos

Los datos e imágenes de las cartas son proporcionados por [Scryfall](https://scryfall.com). _Magic: The Gathering_ es una marca registrada de Wizards of the Coast. Este es un proyecto de fans no oficial y no está afiliado ni cuenta con el respaldo de Wizards of the Coast o Scryfall.

## Licencia

MIT
