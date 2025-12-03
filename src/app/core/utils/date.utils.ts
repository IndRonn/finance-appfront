export class DateUtils {

  /**
   * Devuelve la fecha actual en formato 'YYYY-MM-DDTHH:mm' (Local / Perú)
   * Ideal para inputs type="datetime-local"
   */
  static getCurrentLocalISOString(): string {
    const now = new Date();
    return this.toLocalISOString(now);
  }

  /**
   * Convierte cualquier fecha JS a formato local 'YYYY-MM-DDTHH:mm'
   * sin hacer la conversión a UTC que hace toISOString() por defecto.
   */
  static toLocalISOString(date: Date | string): string {
    const d = new Date(date);
    // Ajustamos el desfase horario manualmente para cancelar el efecto UTC
    const offsetMs = d.getTimezoneOffset() * 60000;
    const localDate = new Date(d.getTime() - offsetMs);

    // Retornamos cortando los segundos y milisegundos para el input HTML
    return localDate.toISOString().slice(0, 16);
  }
}
