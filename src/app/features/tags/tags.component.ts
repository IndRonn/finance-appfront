import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TagService } from './services/tag.service'; // Ajusta la ruta si es necesario
import { Tag, TagRequest } from '@core/models/tag.model'; // Ajusta la ruta
import { ModalComponent } from '@shared/components/modal/modal.component';

@Component({
  selector: 'app-tags',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.scss']
})
export class TagsComponent implements OnInit {
  private tagService = inject(TagService);
  private fb = inject(FormBuilder);

  // Estados Reactivos
  tags = signal<Tag[]>([]);
  isLoading = signal(true);
  isModalOpen = signal(false);
  isSubmitting = signal(false);

  // PALETA SLYTHERIN & FRIENDS (8 Colores Curados)
  readonly PRESET_COLORS = [
    '#2C5F53', // Slytherin Brand
    '#D32F2F', // Rojo Alerta
    '#1976D2', // Azul Tech
    '#F57F17', // Dorado Riqueza
    '#7B1FA2', // Púrpura Real
    '#00897B', // Teal Balance
    '#C2185B', // Magenta Pasión
    '#546E7A'  // Gris Acero
  ];

  // Formulario
  tagForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(20)]],
    color: [this.PRESET_COLORS[0], [Validators.required]]
  });

  ngOnInit() {
    this.loadTags();
  }

  loadTags() {
    this.isLoading.set(true);
    this.tagService.getAll().subscribe({
      next: (data) => {
        this.tags.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  // --- Modal & Creación ---

  openCreate() {
    this.tagForm.reset({ color: this.PRESET_COLORS[0] });
    this.isModalOpen.set(true);
  }

  selectColor(color: string) {
    this.tagForm.patchValue({ color });
  }

  isColorSelected(color: string): boolean {
    return this.tagForm.get('color')?.value === color;
  }

  onSubmit() {
    if (this.tagForm.invalid) return;
    this.isSubmitting.set(true);

    const request = this.tagForm.value as TagRequest;

    this.tagService.create(request).subscribe({
      next: (newTag) => {
        this.tags.update(list => [...list, newTag]);
        this.closeModal();
      },
      error: () => {
        this.isSubmitting.set(false);
        // Aquí podrías mostrar un toast de error
      }
    });
  }

  // --- Acciones ---

  deleteTag(id: number) {
    if (!confirm('¿Eliminar esta etiqueta?')) return;

    // Simulación Optimista (Implementar llamada real al backend)
    // this.tagService.delete(id).subscribe(...);
    this.tags.update(list => list.filter(t => t.id !== id));
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.isSubmitting.set(false);
  }
}
