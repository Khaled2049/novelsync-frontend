import { useCallback, useEffect, useState } from "react";

interface AsyncState<T> {
  loading: boolean;
  error: Error | undefined;
  value: T | undefined;
}

interface AsyncFunctionState<T> extends AsyncState<T> {
  execute: (...params: any[]) => Promise<T>;
}

type AsyncFunction<T> = (...params: any[]) => Promise<T>;

export function useAsync<T>(
  func: AsyncFunction<T>,
  dependencies: any[] = []
): AsyncState<T> {
  const { execute, ...state } = useAsyncInternal<T>(func, dependencies, true);

  useEffect(() => {
    execute();
  }, [execute]);

  return state;
}

export function useAsyncFn<T>(
  func: AsyncFunction<T>,
  dependencies: any[] = []
): AsyncFunctionState<T> {
  return useAsyncInternal<T>(func, dependencies, false);
}

function useAsyncInternal<T>(
  func: AsyncFunction<T>,
  dependencies: any[],
  initialLoading = false
): AsyncFunctionState<T> {
  const [loading, setLoading] = useState<boolean>(initialLoading);
  const [error, setError] = useState<Error>();
  const [value, setValue] = useState<T>();

  const execute = useCallback((...params: any[]): Promise<T> => {
    setLoading(true);
    return func(...params)
      .then((data) => {
        setValue(data);
        setError(undefined);
        return data;
      })
      .catch((error) => {
        setError(error);
        setValue(undefined);
        return Promise.reject(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, dependencies);

  return { loading, error, value, execute };
}
