import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent {
  @Input() title: string = '';
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }

  // Evita que el click dentro del modal lo cierre (Propagación)
  stopPropagation(event: Event) {
    event.stopPropagation();
  }
}
