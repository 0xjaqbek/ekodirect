// shared/hooks/index.ts

import { useState, useEffect, useCallback, RefObject } from 'react';
import { STORAGE_KEYS } from '../constants';

/**
 * Hook do bezpiecznego używania localStorage z typami
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Pobierz początkową wartość z localStorage lub użyj initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Błąd podczas odczytu z localStorage "${key}":`, error);
      return initialValue;
    }
  });

  // Opakowana wersja metody setItem z localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Wartość może być funkcją korzystającą z poprzedniego stanu
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Błąd podczas zapisu do localStorage "${key}":`, error);
    }
  }, [key, storedValue]);

  // Nasłuchiwanie zmian tego klucza w innych zakładkach/oknach
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Błąd podczas parsowania wartości z localStorage:`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue] as const;
}

/**
 * Hook do sprawdzania media queries
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

/**
 * Hook sprawdzający czy urządzenie jest mobilne
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * Hook do wykrywania kliknięć poza elementem
 */
export function useOutsideClick(ref: RefObject<HTMLElement>, callback: () => void) {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, callback]);
}

/**
 * Hook do debounce wartości
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook do pobierania geolokalizacji użytkownika
 */
export function useGeolocation() {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation({ 
        latitude: 0, 
        longitude: 0, 
        error: 'Geolokalizacja nie jest obsługiwana przez twoją przeglądarkę.' 
      });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLoading(false);
      },
      (error) => {
        let errorMessage = 'Nieznany błąd podczas pobierania lokalizacji.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Odmówiono dostępu do geolokalizacji.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Informacja o lokalizacji jest niedostępna.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Upłynął limit czasu dla żądania lokalizacji.';
            break;
        }
        setLocation({ latitude: 0, longitude: 0, error: errorMessage });
        setLoading(false);
      }
    );
  }, []);

  return { location, loading, getLocation };
}

/**
 * Hook do zarządzania koszykiem
 */
export function useCart() {
  const [cart, setCart] = useLocalStorage<Array<{
    productId: string;
    quantity: number;
    price: number;
    name: string;
    image?: string;
  }>>(STORAGE_KEYS.CART, []);
  
  // Dodaj produkt do koszyka
  const addToCart = useCallback((product: {
    _id: string;
    name: string;
    price: number;
    image?: string;
  }, quantity: number) => {
    setCart(prevCart => {
      // Sprawdź czy produkt jest już w koszyku
      const existingIndex = prevCart.findIndex(item => item.productId === product._id);
      
      if (existingIndex >= 0) {
        // Zaktualizuj ilość jeśli produkt istnieje
        const updatedCart = [...prevCart];
        updatedCart[existingIndex].quantity += quantity;
        return updatedCart;
      } else {
        // Dodaj nowy produkt do koszyka
        return [...prevCart, {
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity,
          image: product.image
        }];
      }
    });
  }, [setCart]);
  
  // Usuń produkt z koszyka
  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  }, [setCart]);
  
  // Zaktualizuj ilość produktu
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCart(prevCart => {
      if (quantity <= 0) {
        return prevCart.filter(item => item.productId !== productId);
      }
      
      return prevCart.map(item => 
        item.productId === productId 
          ? { ...item, quantity } 
          : item
      );
    });
  }, [setCart]);
  
  // Wyczyść koszyk
  const clearCart = useCallback(() => {
    setCart([]);
  }, [setCart]);
  
  // Oblicz podsumowanie koszyka
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((count, item) => count + item.quantity, 0);
  
  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    itemCount
  };
}