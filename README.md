# Super Bowl LX Quiniela

Aplicación web para quiniela del Super Bowl con leaderboard en tiempo real y panel de administración.

## Estructura del Proyecto

```
superbowl-quiniela/
├── src/                    # Frontend React
│   ├── App.jsx
│   ├── screens/
│   │   ├── LeaderboardScreen.jsx
│   │   └── AdminScreen.jsx
│   ├── hooks/
│   │   └── useSSE.js
│   └── services/
│       └── api.js
│
├── backend/                # Backend Node.js/Express
│   ├── src/
│   │   ├── index.js
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── services/
│   ├── schema.sql
│   └── package.json
│
└── railway.json            # Deploy config
```

## Setup Local

### 1. Base de Datos PostgreSQL

Crear la base de datos y ejecutar el schema:

```bash
createdb quiniela
psql -d quiniela -f backend/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env  # Editar con tus credenciales
npm install
npm run dev
```

### 3. Frontend

```bash
npm install
npm run dev
```

La app estará disponible en `http://localhost:3000`

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/users` | Registrar usuario |
| POST | `/api/predictions` | Guardar predicciones |
| GET | `/api/leaderboard` | Obtener leaderboard |
| GET | `/api/leaderboard/stream` | SSE para updates en vivo |
| POST | `/api/admin/verify` | Verificar PIN admin |
| POST | `/api/admin/answers/:id` | Marcar respuesta correcta |
| PUT | `/api/admin/settings` | Cambiar configuración |

## Panel de Admin

PIN por defecto: `1357`

Funcionalidades:
- Toggle visibilidad de respuestas
- Bloquear/desbloquear predicciones
- Marcar respuestas correctas
- Ver participantes

## Sistema de Puntos

- Cada pregunta correcta = 1 punto
- Pregunta del ganador (Q14) = 2 puntos
- Desempate: quien completó predicciones primero

## Deployment

### Frontend → Netlify/Vercel

Variables de entorno:
- `VITE_API_URL=https://tu-backend.railway.app`

### Backend → Railway

1. Agregar PostgreSQL addon
2. Variables de entorno:
   - `DATABASE_URL` (auto-configurado)
   - `ADMIN_PIN=1357`
   - `FRONTEND_URL=https://tu-frontend.netlify.app`
   - `NODE_ENV=production`
