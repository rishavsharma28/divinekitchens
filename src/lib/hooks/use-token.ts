import { atom, useAtom } from 'jotai';

const currentToken = atom(
  typeof window !== 'undefined' ? localStorage.getItem('token') : false
);

const accessTokenAtomWithPersistence = atom(
  (get) => get(currentToken),
  async (get, set, newStorage: any) => {
    set(currentToken, newStorage);
    localStorage.setItem('token', newStorage);
  }
);

export function useAccessToken() {
  const [accessToken, setAccessToken] = useAtom(accessTokenAtomWithPersistence);

  return {
    accessToken,
    setAccessToken,
  };
}