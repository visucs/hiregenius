import { useState, useCallback } from 'react';

/**
 * useApiCall — wraps any async API call with loading/error/success states.
 * Rules.md §4: every API call must handle all three states.
 *
 * @returns {{ execute, isLoading, error, data, reset }}
 *
 * Usage:
 *   const { execute, isLoading, error, data } = useApiCall();
 *   const result = await execute(() => authService.login(payload));
 */
const useApiCall = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(async (apiFunction) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiFunction();
      setData(response.data);
      return response.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Something went wrong. Please try again.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  return { execute, isLoading, error, data, reset };
};

export default useApiCall;
