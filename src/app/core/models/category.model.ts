// src/app/core/models/category.model.ts
import { TransactionType } from './enums.model';

// Aseguramos que los ENUMs del backend estén en un solo lugar
export enum CategoryManagementType {
  PLANIFICADO_MENSUAL = 'PLANIFICADO_MENSUAL',
  DIA_A_DIA = 'DIA_A_DIA'
}

// Interfaz para la respuesta GET /categories
export interface CategoryResponse {
  id: number;
  name: string;
  type: TransactionType; // INGRESO | GASTO
  managementType: CategoryManagementType;
}

// Request para crear categorías (Si fuera necesario)
export interface CategoryRequest {
  name: string;
  type: TransactionType;
  managementType: CategoryManagementType;
}
