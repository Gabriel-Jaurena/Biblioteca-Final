import { Libro } from "./libro"; // El CLI no agrega imports, esto lo pones vos

export interface Saga {
  id: number;
  nombre: string;
  description?: string;
  fechaInicio?: string;
  era?: string;
  libros?: Libro[];
}
