export function createApiClient(token: string) {
  return {
    fetch: async (url: string, options: RequestInit = {}) => {
      const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.error.message}`);
      }

      return response.json();
    },
  };
}