export const authService = {
  login: async (username: string) => {
    // Mock authentication
    return new Promise<{ username: string; token: string }>((resolve) => {
      setTimeout(() => {
        resolve({ username, token: "mock-jwt-token" });
      }, 500);
    });
  },
  logout: async () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 200);
    });
  }
};
