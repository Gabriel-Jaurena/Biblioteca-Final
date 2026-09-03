import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router'; // Para leer la URL
import { LibroService } from '../../services/libro';
import { Libro } from '../../interfaces/libro';

@Component({
  selector: 'app-detalle-libro',
  standalone: true,
  imports: [CommonModule, RouterLink], // Importar RouterLink para poder volver
  templateUrl: './detalle-libro.html',
  styleUrl: './detalle-libro.css'
})
export class DetalleLibroComponent implements OnInit {

  libro: Libro | null = null;

  constructor(
    private route: ActivatedRoute, // Para acceder a los params de la URL
    private libroService: LibroService
  ) {}

  ngOnInit(): void {
    // Capturamos el ID de la URL (ej: /libros/5 -> id = 5)
    const id = Number(this.route.snapshot.paramMap.get('id'));
    
    if (id) {
      this.libroService.getLibroById(id).subscribe({
        next: (datos) => this.libro = datos,
        error: (err) => console.error('Error al cargar libro', err)
      });
    }
  }
}