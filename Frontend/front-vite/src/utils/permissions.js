export function hasPermission(identity, permisoId) {
  if (!identity) return false;
  // identity.permisos expected to be array of numbers or strings
  const perms = identity.permisos || [];
  if (import.meta.env.DEV) {
    try {
      console.debug('permissions: hasPermission check', { permisoId, perms });
    } catch {
      // ignore
    }
  }
  return perms.some(p => Number(p) === Number(permisoId));
}

export function hasAnyPermission(identity, permisoIds = []) {
  if (!identity) return false;
  if (import.meta.env.DEV) {
    try {
      console.debug('permissions: hasAnyPermission check', { permisoIds, perms: identity.permisos });
    } catch {
      // ignore
    }
  }
  return permisoIds.some(id => hasPermission(identity, id));
}
