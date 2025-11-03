// Mock session data for development
const mockUser = {
  id: 'mock-user-id',
  email: 'dev@local',
  name: 'Development User'
};

// Mock SessionProvider component
export const SessionProvider = ({ children }: { children: any }) => {
  // Since this is a .ts file, we'll return the children directly
  // In a real implementation, this would be a React component
  return children;
};

// Mock useSession hook
export const useSession = () => ({
  data: { user: mockUser },
  status: 'authenticated' as const,
  user: mockUser
});

// Additional auth utilities that might be needed
export const signIn = async (email: string, _password: string) => {
  console.warn('[auth] Mock signIn called with:', email);
  return { user: mockUser, error: null };
};

export const signOut = async () => {
  console.warn('[auth] Mock signOut called');
  return { error: null };
};

export const signUp = async (email: string, _password: string) => {
  console.warn('[auth] Mock signUp called with:', email);
  return { user: mockUser, error: null };
};
