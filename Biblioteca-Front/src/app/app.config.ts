import type { ApplicationConfig} from '@angular/core';
import { provideZoneChangeDetection } from '@angular/core'; // <-- Usar Zone
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
  withNoHttpTransferCache,
} from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    // CAMBIO AQUÍ: Quitamos Zoneless y ponemos la configuración estándar
    provideZoneChangeDetection({ eventCoalescing: true }), 
    
    provideRouter(routes),
    // Sin cache HTTP entre servidor y cliente: el navegador siempre consulta
    // la API en lugar de reutilizar datos serializados durante el SSR.
    provideClientHydration(withEventReplay(), withNoHttpTransferCache()),
    provideHttpClient(withFetch())
  ]
};