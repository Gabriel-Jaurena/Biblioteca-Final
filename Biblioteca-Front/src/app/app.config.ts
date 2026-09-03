import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core'; // <-- Usar Zone
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    // CAMBIO AQUÍ: Quitamos Zoneless y ponemos la configuración estándar
    provideZoneChangeDetection({ eventCoalescing: true }), 
    
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch())
  ]
};