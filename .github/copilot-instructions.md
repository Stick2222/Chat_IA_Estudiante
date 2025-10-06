# Copilot Instructions for AI Agents

## Arquitectura General

Este monorepo contiene tres grandes componentes:
- **back-main/back-main/Estudiante/**: Backend Django REST API para gestión de estudiantes, carreras, inscripciones, materias, niveles y paralelos.
- **front-main/front-main/**: Frontend React + TypeScript + Vite, consume la API REST y gestiona la autenticación JWT.
- **frontend/**: Frontend Next.js, orientado a nuevas funcionalidades y UI moderna.

## Backend (Django)
- Ubicación principal: `back-main/back-main/Estudiante/Estudiante/`
- Modelos clave: `AppEstudiante/models.py` (Estudiante, Carrera, Nivel, Materia, Paralelo, Inscripcion)
- Serialización: `AppEstudiante/serializers.py` (serializadores personalizados, manejo de contraseñas con hash)
- Vistas: `AppEstudiante/views.py` (ViewSets para CRUD, endpoints personalizados para registro, perfil, cambio de contraseña, inscripciones)
- Rutas: `AppEstudiante/urls.py` (routers DRF, endpoints extra)
- Autenticación: JWT vía `djangorestframework_simplejwt`, registro y login generan tokens automáticamente.
- Convención: El campo `nombre` es el identificador de usuario (`USERNAME_FIELD`).
- Para comandos de gestión: usar `python manage.py <comando>` desde `Estudiante/Estudiante/`.
- Dependencias en `requirements.txt`.

## Frontend (React + Vite)
- Ubicación: `front-main/front-main/`
- API central: `src/api/api.ts` (instancia Axios, manejo de tokens JWT, interceptores para login/logout)
- Servicios: `src/api/*api.ts` (cada entidad tiene su propio servicio, ejemplo: `estudianteapi.ts`, `carreraapi.ts`, etc.)
- Modelos TypeScript: `src/models/models.ts` (interfaces para tipado estricto)
- Convención: Todas las llamadas usan rutas REST del backend, ejemplo: `/estudiante/`, `/carrera/`, `/mis-inscripciones/`.
- Autenticación: El token JWT se almacena en `localStorage` y se agrega automáticamente a cada request.
- Para desarrollo: `npm run dev` en la raíz de `front-main/front-main/`.

## Frontend (Next.js)
- Ubicación: `frontend/`
- Estructura moderna con `src/app/`, `src/services/`, `src/components/`.
- Para desarrollo: `npm run dev` en la raíz de `frontend/`.

## Convenciones y Patrones
- **Backend**: Uso de ViewSets y APIView para endpoints RESTful y personalizados. Serializadores excluyen campos `estado` y fechas cuando no son relevantes para el frontend.
- **Frontend**: Cada entidad tiene su propio servicio API. Los modelos TypeScript reflejan los modelos Django, pero pueden tener campos opcionales para facilitar la edición y visualización.
- **Autenticación**: El flujo de login/registro siempre retorna tokens JWT. El frontend debe refrescar el token y redirigir al login si expira.
- **Integración**: El frontend consume la API en `http://127.0.0.1:8000/api/` por defecto.

## Ejemplo de flujo completo
1. Registro de estudiante: POST a `/register/` → recibe tokens JWT.
2. Acceso a perfil: GET a `/perfil/` con JWT.
3. Inscripción: POST a `/inscripcion/` con IDs de estudiante, carrera y paralelo.
4. Visualización: GET a `/mis-inscripciones/` para ver inscripciones activas.

## Recomendaciones para agentes
- Mantener la correspondencia entre modelos Django y TypeScript.
- Usar los servicios API existentes para CRUD y operaciones personalizadas.
- Seguir la estructura de carpetas y convenciones de nombres para nuevos endpoints o servicios.
- Validar siempre la presencia y formato del token JWT en el frontend.
- Para nuevas entidades, crear: modelo Django, serializer, viewset, servicio API y modelo TypeScript.

## Archivos clave
- Backend: `AppEstudiante/models.py`, `AppEstudiante/serializers.py`, `AppEstudiante/views.py`, `AppEstudiante/urls.py`, `requirements.txt`
- Frontend React: `src/api/api.ts`, `src/models/models.ts`, `src/api/*api.ts`
- Frontend Next.js: `src/services/`, `src/app/`, `src/components/`

---
¿Falta alguna convención, flujo o integración importante? Indica detalles específicos para mejorar estas instrucciones.