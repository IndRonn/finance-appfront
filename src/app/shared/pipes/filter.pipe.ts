import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: true
})
export class FilterPipe implements PipeTransform {

  /**
   * Filtra un array de objetos.
   * @param items Array a filtrar (ej: Categorías, Cuentas).
   * @param filterValue Valor por el que filtrar/excluir (ej: 'GASTO' o ID de cuenta).
   * @param propertyName Nombre de la propiedad del objeto a comparar (ej: 'type'). Si es null, filtra por exclusión de ID.
   */
  transform<T>(items: T[] | null, filterValue: any, propertyName?: keyof T): T[] | null {
    if (!items || !filterValue) {
      return items;
    }

    // 1. FILTRAR POR PROPIEDAD (Para Categorías: filter:GASTO:'type')
    if (propertyName) {
      return items.filter(item => item[propertyName] === filterValue);
    }

    // 2. FILTRAR POR EXCLUSIÓN DE ID (Para Cuentas: Excluye la cuenta con ID = filterValue)
    else {
      return items.filter(item => {
        const itemAsAccount = item as any; // Cast para acceder a 'id'
        // Solo aplica exclusión si el item tiene un ID que coincide con el valor de filtro.
        return itemAsAccount.id !== filterValue;
      });
    }
  }

}
