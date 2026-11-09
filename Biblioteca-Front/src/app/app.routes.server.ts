import type { ServerRoute } from '@angular/ssr';
import { RenderMode } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // 1. Excepciones para rutas dinámicas (Se generan en vivo en el servidor)
  {
    path: 'libros/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'sagas/:id',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    // Las rutas consumen datos dinámicos de la API: no se prerenderizan
    // en build time (eso hacía fallar el build de Docker por timeout).
    // Se renderizan en el servidor en cada request.
    renderMode: RenderMode.Server
  }
];
