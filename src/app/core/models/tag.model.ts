export interface Tag {
  id: number;
  name: string;
  color: string; // Hex: #FF5733
}

export interface TagRequest {
  name: string;
  color: string;
}
