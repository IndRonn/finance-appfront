import { Pipe, PipeTransform, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

@Pipe({
  name: 'slytherinCurrency',
  standalone: true
})
export class SlytherinCurrencyPipe implements PipeTransform {
  // Inyectamos el CurrencyPipe nativo para usar su motor de formateo
  private currencyPipe = new CurrencyPipe('en-US'); // O 'es-PE' si prefieres comas/puntos locales

  transform(
    value: number | null | undefined,
    currencyCode: string = 'PEN',
    digitsInfo: string = '1.2-2'
  ): string | null {
    if (value === null || value === undefined) return null;

    // 1. Lógica de Símbolos Personalizada
    let symbol = currencyCode;
    if (currencyCode === 'PEN') symbol = 'S/ ';
    else if (currencyCode === 'USD') symbol = '$ ';

    // 2. Delegamos el trabajo sucio (formateo de miles/decimales) a Angular
    // Pasamos nuestro símbolo personalizado
    return this.currencyPipe.transform(value, currencyCode, symbol, digitsInfo);
  }
}
