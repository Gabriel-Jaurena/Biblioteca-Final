import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Saga } from '../../interfaces/saga';
import { Libro } from '../../interfaces/libro';
import { SagaService } from '../../services/saga';
import { LibroService } from '../../services/libro';

@Component({
  selector: 'app-detalle-saga',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './detalle-saga.html',
  styleUrl: './detalle-saga.css'
})
export class DetalleSagaComponent implements OnInit {
  saga: Saga | null = null;
  libros: Libro[] = [];

  constructor(
    private route: ActivatedRoute,
    private sagaService: SagaService,
    private libroService: LibroService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.sagaService.getSagaById(id).subscribe(data => this.saga = data);
      // Usamos el nuevo método del servicio para filtrar por ID
      this.libroService.getLibrosBySaga(id).subscribe(data => this.libros = data);
    }
  }
}