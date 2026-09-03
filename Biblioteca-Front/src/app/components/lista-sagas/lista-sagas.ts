import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Saga } from '../../interfaces/saga';
import { SagaService } from '../../services/saga';

@Component({
  selector: 'app-lista-sagas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './lista-sagas.html',
  styleUrl: './lista-sagas.css'
})
export class ListaSagasComponent implements OnInit {

  sagas: Saga[] = [];
  esEdicion: boolean = false;

  // Filtros y Ordenamiento
  filtroNombre: string = '';
  filtroLibroTitulo: string = '';
  criterioOrden: string = 'reciente'; // <--- Nueva variable

  // Modelo Formulario
  nuevaSaga: Saga = { id: 0, nombre: '', description: '', fechaInicio: '', era: '' };

  constructor(private sagaService: SagaService) {}

  ngOnInit(): void {
    this.cargarSagas();
  }

  cargarSagas() {
    this.sagaService.getSagas(this.filtroNombre, this.filtroLibroTitulo).subscribe({
      next: (datos) => {
        this.sagas = datos;
        this.ordenarSagas(); // <--- Ordenar al cargar
      },
      error: (err) => console.error(err)
    });
  }

  buscar() {
    this.cargarSagas();
  }

  limpiarFiltros() {
    this.filtroNombre = '';
    this.filtroLibroTitulo = '';
    this.cargarSagas();
  }

  // --- LÓGICA DE ORDENAMIENTO ---
  ordenarSagas() {
    switch (this.criterioOrden) {
      case 'reciente':
        this.sagas.sort((a, b) => b.id - a.id);
        break;
      case 'antiguo':
        this.sagas.sort((a, b) => a.id - b.id);
        break;
      case 'alfabetico':
        this.sagas.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case 'era':
        // Ordenar por Era alfabéticamente
        this.sagas.sort((a, b) => (a.era || '').localeCompare(b.era || ''));
        break;
    }
  }

  // --- CRUD ---

  procesarFormulario() {
    if (this.esEdicion) {
      this.actualizarSaga();
    } else {
      this.agregarSaga();
    }
  }

  agregarSaga() {
    this.sagaService.createSaga(this.nuevaSaga).subscribe({
      next: (sagaCreada) => {
        this.sagas = [...this.sagas, sagaCreada];
        this.limpiarFormulario();
        this.ordenarSagas(); // Reordenar al agregar
        alert('Saga creada con éxito');
      },
      error: () => alert('Error al crear')
    });
  }

  actualizarSaga() {
    const id = this.nuevaSaga.id;
    this.sagaService.updateSaga(id, this.nuevaSaga).subscribe({
      next: (actualizada) => {
        this.sagas = this.sagas.map(s => s.id === id ? actualizada : s);
        this.limpiarFormulario();
        this.ordenarSagas(); // Reordenar al actualizar
        alert('Saga actualizada');
      },
      error: () => alert('Error al actualizar')
    });
  }
  
  borrarSaga(id: number) {
      if(!confirm('¿Borrar esta saga?')) return;
      this.sagaService.deleteSaga(id).subscribe({
          next: () => this.sagas = this.sagas.filter(s => s.id !== id),
          error: (e) => alert('Error al borrar')
      })
  }
  
  cargarDatosParaEditar(saga: Saga) {
      this.esEdicion = true;
      this.nuevaSaga = { ...saga, fechaInicio: saga.fechaInicio ? saga.fechaInicio.split('T')[0] : '' };
  }
  
  limpiarFormulario() {
      this.esEdicion = false;
      this.nuevaSaga = { id: 0, nombre: '', description: '', fechaInicio: '', era: '' };
  }
}