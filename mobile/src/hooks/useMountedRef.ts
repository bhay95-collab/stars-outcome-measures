import { useEffect, useRef } from 'react';

export function useMountedRef() {
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);
  return mountedRef;
}
