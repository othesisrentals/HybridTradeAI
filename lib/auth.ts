import { createContext, useContext } from 'react';
export const SessionProvider = ({ children }: any) => <>{children}</>;
export const useSession = () => ({ user: null });
