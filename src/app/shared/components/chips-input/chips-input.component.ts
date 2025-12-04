import { Component, ElementRef, ViewChild, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TagService } from '@features/tags/services/tag.service';
import { Tag } from '@core/models/tag.model';

@Component({
  selector: 'app-chips-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chips-input.component.html',
  styleUrls: ['./chips-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: ChipsInputComponent,
      multi: true
    }
  ]
})
export class ChipsInputComponent implements ControlValueAccessor {
  private tagService = inject(TagService);

  // Estados
  allTags = signal<Tag[]>([]);      // Todas las etiquetas disponibles
  selectedTags = signal<Tag[]>([]); // Las que el usuario eligió
  inputValue = signal('');          // Lo que el usuario está escribiendo
  showDropdown = signal(false);     // Control de visibilidad de sugerencias

  // Para el formulario padre
  onChange: (value: number[]) => void = () => {};
  onTouched: () => void = () => {};

  @ViewChild('inputBox') inputBox!: ElementRef<HTMLInputElement>;

  constructor() {
    this.loadTags();
  }

  private loadTags() {
    this.tagService.getAll().subscribe(tags => this.allTags.set(tags));
  }

  // --- Lógica de Filtrado ---
  get filteredTags(): Tag[] {
    const search = this.inputValue().toLowerCase();
    const selectedIds = this.selectedTags().map(t => t.id);

    // Mostrar solo las que coinciden con el texto y NO han sido seleccionadas
    return this.allTags().filter(tag =>
      tag.name.toLowerCase().includes(search) && !selectedIds.includes(tag.id)
    );
  }

  // --- Acciones ---

  onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.inputValue.set(value);
    this.showDropdown.set(true);
  }

  selectTag(tag: Tag) {
    this.selectedTags.update(curr => [...curr, tag]);
    this.notifyChange();
    this.resetInput();
  }

  removeTag(tagId: number) {
    this.selectedTags.update(curr => curr.filter(t => t.id !== tagId));
    this.notifyChange();
  }

  // Crear etiqueta al vuelo (Enter)
  async createTag(name: string) {
    if (!name.trim()) return;

    // Generar color aleatorio elegante
    const color = '#' + Math.floor(Math.random()*16777215).toString(16);

    this.tagService.create({ name, color }).subscribe(newTag => {
      this.allTags.update(curr => [...curr, newTag]); // Agregar a la lista global
      this.selectTag(newTag); // Seleccionarla automáticamente
    });
  }

  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault(); // Evitar submit del formulario padre
      const val = this.inputValue();

      // Si hay una coincidencia exacta en sugerencias, úsala (opcional)
      // Si no, crea una nueva
      if (val) this.createTag(val);
    }
    if (event.key === 'Backspace' && !this.inputValue()) {
      // Borrar la última etiqueta si el input está vacío
      const current = this.selectedTags();
      if (current.length > 0) {
        this.removeTag(current[current.length - 1].id);
      }
    }
  }

  // --- Helpers Internos ---
  private notifyChange() {
    const ids = this.selectedTags().map(t => t.id);
    this.onChange(ids); // Avisar al formulario que el valor cambió (array de IDs)
  }

  private resetInput() {
    this.inputValue.set('');
    this.showDropdown.set(false);
    this.inputBox.nativeElement.value = '';
    this.inputBox.nativeElement.focus();
  }

  // --- ControlValueAccessor ---
  writeValue(ids: number[]): void {
    if (ids && ids.length) {
      // Recuperar los objetos Tag completos basados en los IDs
      // (Nota: Requiere que allTags ya esté cargado, idealmente usar computed o effects)
      const tags = this.allTags().filter(t => ids.includes(t.id));
      this.selectedTags.set(tags);
    } else {
      this.selectedTags.set([]);
    }
  }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
}
