// src/shared/utils/formatDate.ts

// Definiujemy typ FirebaseTimestamp lokalnie w tym samym pliku, aby uniknąć problemów z importem
type FirebaseTimestamp = {
    toDate: () => Date;
    seconds: number;
    nanoseconds: number;
  };
  
  /**
   * Formatowanie daty - obsługuje różne formaty daty, w tym Firestore Timestamp
   */
  export const formatDate = (date: Date | string | number | FirebaseTimestamp | unknown): string => {
    if (!date) return '';
    
    let dateObj: Date;
    
    try {
      // Sprawdź czy to obiekt Firestore Timestamp
      if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
        // Konwertuj Firestore Timestamp na Date
        dateObj = (date as FirebaseTimestamp).toDate();
      } 
      // Sprawdź czy to string lub obiekt Date
      else if (typeof date === 'string') {
        dateObj = new Date(date);
      }
      else if (date instanceof Date) {
        dateObj = date;
      }
      // Jeśli to liczba, potraktuj jako timestamp (milisekundy)
      else if (typeof date === 'number') {
        dateObj = new Date(date);
      }
      else {
        console.warn('Nieprawidłowy format daty:', date);
        return '';
      }
      
      // Sprawdź czy data jest poprawna
      if (isNaN(dateObj.getTime())) {
        console.warn('Nieprawidłowa data:', date);
        return '';
      }
      
      return new Intl.DateTimeFormat('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(dateObj);
    } catch (error) {
      console.warn('Błąd podczas formatowania daty:', error);
      return '';
    }
  };