/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

// Shape: { idCargo: number, permisos: number[] }
const PermissionContext = createContext(null);

export function PermissionProvider({ children }) {
  const [identity, setIdentity] = useState(() => {
    try {
      const raw = localStorage.getItem('identity');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('PermissionContext: error parsing identity from localStorage', e);
      return null;
    }
  });

  const saveIdentity = useCallback((obj) => {
    setIdentity(prev => {
      try {
        const prevJson = prev ? JSON.stringify(prev) : null;
        const newJson = obj ? JSON.stringify(obj) : null;
        if (prevJson === newJson) {
          // no change -> avoid updating state/storage
          return prev;
        }
      } catch {
        // if stringify fails, fall back to setting
      }
      try {
        if (obj) localStorage.setItem('identity', JSON.stringify(obj));
        else localStorage.removeItem('identity');
      } catch (_e) { console.warn('PermissionContext: error saving identity', _e); }
      return obj;
    });
  }, []);
  const value = useMemo(() => ({ identity, setIdentity: saveIdentity }), [identity, saveIdentity]);
  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermission() {
  return useContext(PermissionContext);
}

export default PermissionContext;
