import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Libro } from '../../interfaces/libro';
import { LibroService } from '../../services/libro';

@Component({
  selector: 'app-lista-libros',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './lista-libros.html',
  styleUrl: './lista-libros.css'
})
export class ListaLibrosComponent implements OnInit {

  libros: Libro[] = [];
  esEdicion: boolean = false;

  // Filtros
  filtroTitulo: string = '';
  filtroAnio: number | null = null;

  // Modelo del formulario
  nuevoLibro: Libro = {
    id: 0,
    sagaId: 1,
    titulo: '',
    autor: '',
    fechaEdicion: '',
    numeroPaginas: 0,
    descripcion: ''
  };

  criterioOrden: string = 'reciente';

  constructor(private libroService: LibroService) {}

  ngOnInit(): void {
    this.cargarLibros();
  }

  // --- CARGA DE DATOS ---
  cargarLibros() {
    const anio = this.filtroAnio ? this.filtroAnio : undefined;
    this.libroService.getLibros(this.filtroTitulo, anio).subscribe({
      next: (datos) => {
        this.libros = datos; // Zone.js detectará esto y actualizará la vista
        // 3. ¡Ordenamos apenas llegan los datos!
        this.ordenarLibros();
      },
      error: (err) => console.error(err)
    });
  }

  // 2. Lógica de Ordenamiento
  ordenarLibros() {
    switch (this.criterioOrden) {
      case 'reciente':
        // Ordenar por ID descendente (el ID más alto es el último creado)
        this.libros.sort((a, b) => b.id - a.id);
        break;
      
      case 'antiguo':
        // Ordenar por ID ascendente
        this.libros.sort((a, b) => a.id - b.id);
        break;

      case 'alfabetico':
        // Comparar strings (localeCompare maneja acentos)
        this.libros.sort((a, b) => a.titulo.localeCompare(b.titulo));
        break;

      case 'anio':
        // Comparar fechas (string ISO se puede comparar directo o convertir a Date)
        // Ordenamos del más nuevo al más viejo
        this.libros.sort((a, b) => {
            // Convertimos a fecha real para comparar milisegundos
            return new Date(b.fechaEdicion).getTime() - new Date(a.fechaEdicion).getTime();
        });
        break;
    }
  }

  buscar() {
    this.cargarLibros();
  }

  limpiarFiltros() {
    this.filtroTitulo = '';
    this.filtroAnio = null;
    this.cargarLibros();
  }

  // --- GESTIÓN DEL FORMULARIO ---
  procesarFormulario() {
    if (this.esEdicion) {
      this.actualizarLibro();
    } else {
      this.agregarLibro();
    }
  }

  agregarLibro() {
    this.libroService.createLibro(this.nuevoLibro).subscribe({
      next: (libroCreado) => {
        // Inmutabilidad: Creamos un nuevo array para asegurar detección
        this.libros = [...this.libros, libroCreado];
        this.limpiarFormulario();
        alert('Libro creado con éxito');
      },
      error: (err) => {
        console.error(err);
        alert('Error al crear el libro.');
      }
    });
  }

  actualizarLibro() {
    const id = this.nuevoLibro.id;
    this.libroService.updateLibro(id, this.nuevoLibro).subscribe({
      next: (libroActualizado) => {
        // Buscamos y reemplazamos el libro en la lista local
        // Usamos map para crear un nuevo array con el libro actualizado
        this.libros = this.libros.map(l => l.id === id ? libroActualizado : l);
        
        this.limpiarFormulario();
        alert('Libro actualizado correctamente');
      },
      error: (err) => console.error(err)
    });
  }

  cargarDatosParaEditar(libro: Libro) {
    this.esEdicion = true;
    // Copiamos los datos y formateamos la fecha para el input type="date"
    this.nuevoLibro = { 
      ...libro,
      fechaEdicion: libro.fechaEdicion ? libro.fechaEdicion.toString().split('T')[0] : ''
    };
  }

  borrarLibro(id: number) {
    if (!confirm('¿Borrar este libro?')) return;

    this.libroService.deleteLibro(id).subscribe({
      next: () => {
        // Filtramos para quitar el borrado (crea nuevo array)
        this.libros = this.libros.filter(l => l.id !== id);
      },
      error: (err) => alert('Error al borrar')
    });
  }

  limpiarFormulario() {
    this.esEdicion = false;
    this.nuevoLibro = {
      id: 0,
      sagaId: 1,
      titulo: '',
      autor: '',
      fechaEdicion: '',
      numeroPaginas: 0,
      descripcion: ''
    };
  }
}