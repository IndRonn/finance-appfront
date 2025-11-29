import { AfterViewInit, Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]',
  standalone: true
})
export class AutoFocusDirective implements AfterViewInit {
  // Input para permitir que el foco sea condicional si es necesario
  @Input('appAutoFocus') isEnabled: boolean = true;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit() {
    // Usamos setTimeout para asegurar que la directiva se ejecute
    // DESPUÉS de que el modal haya terminado su animación y se haya renderizado.
    if (this.isEnabled) {
      setTimeout(() => {
        this.el.nativeElement.focus();

        // Opcional: Seleccionar el texto si es un input de monto
        if (this.el.nativeElement instanceof HTMLInputElement) {
          this.el.nativeElement.select();
        }
      }, 50);
    }
  }
}
