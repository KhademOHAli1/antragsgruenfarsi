import useSWR from 'swr';
import { useAuth } from '@/lib/auth/useAuth';
import { api } from '@/lib/api/client';
import type { 
  Motion, 
  MotionList, 
  CreateMotionRequest, 
  UpdateMotionRequest 
} from '@/types/api';

export interface UseMotionOptions {
  consultationPath: string;
  motionSlug?: string;
  revalidateOnFocus?: boolean;
  refreshInterval?: number;
}

export interface UseMotionListOptions {
  consultationPath: string;
  revalidateOnFocus?: boolean;
  refreshInterval?: number;
}

export interface UseMotionReturn {
  motion: Motion | undefined;
  isLoading: boolean;
  error: Error | undefined;
  mutate: () => Promise<Motion | undefined>;
  createMotion: (data: CreateMotionRequest) => Promise<Motion>;
  updateMotion: (data: UpdateMotionRequest) => Promise<Motion>;
  deleteMotion: () => Promise<void>;
}

export interface UseMotionListReturn {
  motions: MotionList | undefined;
  isLoading: boolean;
  error: Error | undefined;
  mutate: () => Promise<MotionList | undefined>;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching and managing a single motion
 */
export function useMotion(options: UseMotionOptions): UseMotionReturn {
  const { consultationPath, motionSlug, revalidateOnFocus = false, refreshInterval } = options;
  const { isAuthenticated, getToken } = useAuth();

  const shouldFetch = isAuthenticated && consultationPath && motionSlug;
  const cacheKey = shouldFetch ? `/rest/${consultationPath}/motion/${motionSlug}` : null;

  const { data: motion, error, mutate, isLoading } = useSWR<Motion>(
    cacheKey,
    async (url: string) => {
      const token = await getToken();
      return api.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    {
      revalidateOnFocus,
      refreshInterval,
      errorRetryCount: 3,
      shouldRetryOnError: (error) => {
        // Don't retry on 4xx errors
        return error?.status >= 500;
      },
    }
  );

  const createMotion = async (data: CreateMotionRequest): Promise<Motion> => {
    const token = await getToken();
    const newMotion = await api.post(`/rest/${consultationPath}/motion`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Revalidate the cache
    await mutate();
    
    return newMotion;
  };

  const updateMotion = async (data: UpdateMotionRequest): Promise<Motion> => {
    if (!motionSlug) {
      throw new Error('Motion slug is required for updates');
    }

    const token = await getToken();
    const updatedMotion = await api.put(`/rest/${consultationPath}/motion/${motionSlug}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Update the cache optimistically
    await mutate(updatedMotion, false);
    
    return updatedMotion;
  };

  const deleteMotion = async (): Promise<void> => {
    if (!motionSlug) {
      throw new Error('Motion slug is required for deletion');
    }

    const token = await getToken();
    await api.delete(`/rest/${consultationPath}/motion/${motionSlug}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Clear the cache
    await mutate(undefined, false);
  };

  return {
    motion,
    isLoading,
    error,
    mutate,
    createMotion,
    updateMotion,
    deleteMotion,
  };
}

/**
 * Hook for fetching a list of motions in a consultation
 */
export function useMotionList(options: UseMotionListOptions): UseMotionListReturn {
  const { consultationPath, revalidateOnFocus = false, refreshInterval } = options;
  const { isAuthenticated, getToken } = useAuth();

  const shouldFetch = isAuthenticated && consultationPath;
  const cacheKey = shouldFetch ? `/rest/${consultationPath}` : null;

  const { data: motions, error, mutate, isLoading } = useSWR<MotionList>(
    cacheKey,
    async (url: string) => {
      const token = await getToken();
      return api.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    {
      revalidateOnFocus,
      refreshInterval,
      errorRetryCount: 3,
      shouldRetryOnError: (error) => {
        return error?.status >= 500;
      },
    }
  );

  const refresh = async (): Promise<void> => {
    await mutate();
  };

  return {
    motions,
    isLoading,
    error,
    mutate,
    refresh,
  };
}

/**
 * Hook for managing motion state and operations
 */
export function useMotionMutations(consultationPath: string) {
  const { getToken } = useAuth();

  const createMotion = async (data: CreateMotionRequest): Promise<Motion> => {
    const token = await getToken();
    return api.post(`/rest/${consultationPath}/motion`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  };

  const updateMotion = async (motionSlug: string, data: UpdateMotionRequest): Promise<Motion> => {
    const token = await getToken();
    return api.put(`/rest/${consultationPath}/motion/${motionSlug}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  };

  const deleteMotion = async (motionSlug: string): Promise<void> => {
    const token = await getToken();
    await api.delete(`/rest/${consultationPath}/motion/${motionSlug}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  return {
    createMotion,
    updateMotion,
    deleteMotion,
  };
}
