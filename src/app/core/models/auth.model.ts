export interface AuthResponse {
  token: string;
}

export interface User {
  email: string;
  firstName: string;
  lastName?: string;
  id?: number; // Útil tenerlo en el front aunque no venga explícito en el login a veces
}
