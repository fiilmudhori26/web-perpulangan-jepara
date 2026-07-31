import { createContext, useContext, useState, useEffect } from 'react';
import { getBrandConfig } from '../api/config';

const BrandContext = createContext(null);

export function BrandProvider({ children }) {
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBrandConfig()
      .then((config) => setBrand(config))
      .catch(() => {
        // fallback default
        setBrand({
          name: 'Santri LP3IA',
          shortName: 'LP3IA',
          tagline: 'Pondok Pesantren Al-Qur\'an LP3IA',
          address: '',
          phone: '',
          email: '',
          website: '',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <BrandContext.Provider value={{ brand, setBrand, loading }}>
      {children}
    </BrandContext.Provider>
  );
}

export const useBrand = () => useContext(BrandContext);
