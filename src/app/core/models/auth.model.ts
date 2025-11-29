// src/app/core/models/auth.model.ts

/**
 * Payload para inicio de sesión
 * Ref: #/components/schemas/LoginRequest
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Payload para registro de nuevo usuario
 * Ref: #/components/schemas/RegisterRequest
 */
export interface RegisterRequest {
  firstName: string;
  lastName?: string; // No está en la lista 'required' del YAML, así que es opcional
  email: string;
  password: string;
}

/**
 * Respuesta del servidor al autenticar
 * Ref: #/components/schemas/AuthResponse
 */
export interface AuthResponse {
  token: string;
}

/**
 * Modelo interno de Usuario (para decodificar el token o uso en UI)
 */
export interface User {
  email: string;
  firstName: string;
  lastName?: string;
  id?: number;
}
