import { RenderMode, ServerRoute } from '@angular/ssr';

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
    renderMode: RenderMode.Prerender
  }
];
