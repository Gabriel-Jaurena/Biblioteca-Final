// src/app/app.ts
import { Component } from '@angular/core';
// 1. Importamos RouterLink además de RouterOutlet
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true, // Esto confirma que es Standalone
  // 2. Añadimos RouterLink a la lista de imports
  imports: [RouterOutlet, RouterLink ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // Ya no necesitamos la variable 'title' porque borraste su uso en el HTML
}