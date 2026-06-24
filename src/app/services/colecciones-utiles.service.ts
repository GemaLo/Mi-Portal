import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ColeccionesUtilesService {

  constructor() { }

  ordenarListaDinamica(
  lista: any[], 
  direccion: 'asc' | 'desc' = 'desc', 
  llave: string = 'num_empleado'
): any[] {
  if (!lista || !Array.isArray(lista)) return [];

  return [...lista].sort((a, b) => {
    // 1. Obtener los valores y asegurar que no sean null/undefined
    let valA = a[llave] !== undefined && a[llave] !== null ? a[llave] : '';
    let valB = b[llave] !== undefined && b[llave] !== null ? b[llave] : '';

    // 2. Detectar si ambos valores son números puros (o strings numéricos como "134")
    const esNumeroA = !isNaN(Number(valA)) && valA !== '';
    const esNumeroB = !isNaN(Number(valB)) && valB !== '';

    if (esNumeroA && esNumeroB) {
      // --- ORDENAMIENTO NUMÉRICO ---
      return direccion === 'desc' 
        ? Number(valB) - Number(valA) 
        : Number(valA) - Number(valB);
    } else {
      // --- ORDENAMIENTO ALFABÉTICO / TEXTO MIXTO ---
      // Forzamos a string para evitar errores con localeCompare
      const strA = String(valA);
      const strB = String(valB);

      return direccion === 'desc'
        ? strB.localeCompare(strA, undefined, { numeric: true, sensitivity: 'base' })
        : strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
    }
  });
}
}
