// Enlaces del autor y del repositorio: se cambian aquí y se actualizan en toda la web
export const PROFILE_URL = "https://github.com/JavierMoyaSimo";
export const REPO_URL = `${PROFILE_URL}/magic-card-store`;

export const TECH_GROUPS = [
  {
    title: "Frontend",
    items: [
      "React y Vite",
      "React Router: rutas anidadas, guardas y carga diferida",
      "CSS con variables, sin librerías de interfaz",
      "Accesibilidad: teclado, etiquetas ARIA y menos animaciones",
    ],
  },
  {
    title: "Backend",
    items: [
      "Node.js y Express",
      "Mongoose",
      "Multer para subir imágenes",
      "Middlewares de autenticación y de roles",
    ],
  },
  {
    title: "Datos y APIs externas",
    items: [
      "MongoDB Atlas, con transacciones",
      "Scryfall: datos e imágenes de las cartas",
      "API de Claude con visión: lee el nombre de una carta en una foto",
    ],
  },
  {
    title: "Seguridad",
    items: [
      "JWT y bcrypt",
      "Roles y control de acceso por objeto",
      "Helmet, CORS restringido y límites de uso",
      "Validación con listas blancas",
    ],
  },
  {
    title: "Calidad y despliegue",
    items: [
      "Tests con node:test y Supertest",
      "Integración continua con GitHub Actions",
      "Render (servicio web y sitio estático)",
      "Entornos de desarrollo y producción separados",
    ],
  },
];

export const DECISIONS = [
  {
    title: "El servidor nunca se fía del navegador",
    text: "El carrito solo envía identificadores y cantidades. El precio y el stock se leen de la base de datos en cada pedido.",
  },
  {
    title: "El stock se descuenta de forma atómica",
    text: "Una sola operación comprueba y resta, dentro de una transacción: dos clientes no pueden comprar a la vez la última unidad, y un pedido se aplica entero o no se aplica.",
  },
  {
    title: "La clave de la IA vive solo en el servidor",
    text: "La foto viaja al backend, que habla con Claude. La salida del modelo se valida contra Scryfall y una persona confirma la carta antes de guardarla.",
  },
  {
    title: "La protección real está en el backend",
    text: "Las guardas del frontend son comodidad. El servidor comprueba el token y el rol en cada petición, y un pedido ajeno responde 404 para no revelar que existe.",
  },
  {
    title: "Rendimiento percibido",
    text: "La carta destacada aparece al instante gracias a una caché local, hay esqueletos de carga contra los saltos de diseño y la web reintenta mientras el servidor gratuito despierta.",
  },
  {
    title: "La URL como fuente de verdad",
    text: "Los filtros, la página y cada carta tienen su dirección: se pueden compartir, el botón Atrás funciona y recargar no pierde nada.",
  },
];

export const ROADMAP = [
  "Pasarela de pago en modo de pruebas (Stripe)",
  "Tests de integración con una base de datos en memoria",
  "Carrito guardado en el servidor, sincronizado entre dispositivos",
  "Cookies httpOnly para la sesión",
];
