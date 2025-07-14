import useSWR from 'swr';
import { useAuth } from '@/lib/auth/useAuth';
import { api } from '@/lib/api/client';
import type { 
  Amendment, 
  AmendmentList, 
  CreateAmendmentRequest, 
  UpdateAmendmentRequest,
  DiffResult 
} from '@/types/api';

export interface UseAmendmentOptions {
  consultationPath: string;
  motionSlug: string;
  amendmentId?: string;
  revalidateOnFocus?: boolean;
  refreshInterval?: number;
}

export interface UseAmendmentListOptions {
  consultationPath: string;
  motionSlug: string;
  revalidateOnFocus?: boolean;
  refreshInterval?: number;
}

export interface UseAmendmentReturn {
  amendment: Amendment | undefined;
  isLoading: boolean;
  error: Error | undefined;
  mutate: () => Promise<Amendment | undefined>;
  createAmendment: (data: CreateAmendmentRequest) => Promise<Amendment>;
  updateAmendment: (data: UpdateAmendmentRequest) => Promise<Amendment>;
  deleteAmendment: () => Promise<void>;
}

export interface UseAmendmentListReturn {
  amendments: AmendmentList | undefined;
  isLoading: boolean;
  error: Error | undefined;
  mutate: () => Promise<AmendmentList | undefined>;
  refresh: () => Promise<void>;
}

export interface UseAmendmentDiffReturn {
  diff: DiffResult | undefined;
  isLoading: boolean;
  error: Error | undefined;
  computeDiff: (originalText: string, amendedText: string) => Promise<DiffResult>;
}

/**
 * Hook for fetching and managing a single amendment
 */
export function useAmendment(options: UseAmendmentOptions): UseAmendmentReturn {
  const { 
    consultationPath, 
    motionSlug, 
    amendmentId, 
    revalidateOnFocus = false, 
    refreshInterval 
  } = options;
  const { isAuthenticated, getToken } = useAuth();

  const shouldFetch = isAuthenticated && consultationPath && motionSlug && amendmentId;
  const cacheKey = shouldFetch ? 
    `/rest/${consultationPath}/motion/${motionSlug}/amendment/${amendmentId}` : 
    null;

  const { data: amendment, error, mutate, isLoading } = useSWR<Amendment>(
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
      shouldRetryOnError: (error: any) => {
        return error?.status >= 500;
      },
    }
  );

  const createAmendment = async (data: CreateAmendmentRequest): Promise<Amendment> => {
    const token = await getToken();
    const newAmendment = await api.post(
      `/rest/${consultationPath}/motion/${motionSlug}/amendment`, 
      data, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Revalidate the cache
    await mutate();
    
    return newAmendment;
  };

  const updateAmendment = async (data: UpdateAmendmentRequest): Promise<Amendment> => {
    if (!amendmentId) {
      throw new Error('Amendment ID is required for updates');
    }

    const token = await getToken();
    const updatedAmendment = await api.put(
      `/rest/${consultationPath}/motion/${motionSlug}/amendment/${amendmentId}`, 
      data, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Update the cache optimistically
    await mutate(updatedAmendment, false);
    
    return updatedAmendment;
  };

  const deleteAmendment = async (): Promise<void> => {
    if (!amendmentId) {
      throw new Error('Amendment ID is required for deletion');
    }

    const token = await getToken();
    await api.delete(
      `/rest/${consultationPath}/motion/${motionSlug}/amendment/${amendmentId}`, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Clear the cache
    await mutate(undefined, false);
  };

  return {
    amendment,
    isLoading,
    error,
    mutate,
    createAmendment,
    updateAmendment,
    deleteAmendment,
  };
}

/**
 * Hook for fetching a list of amendments for a motion
 */
export function useAmendmentList(options: UseAmendmentListOptions): UseAmendmentListReturn {
  const { consultationPath, motionSlug, revalidateOnFocus = false, refreshInterval } = options;
  const { isAuthenticated, getToken } = useAuth();

  const shouldFetch = isAuthenticated && consultationPath && motionSlug;
  const cacheKey = shouldFetch ? `/rest/${consultationPath}/motion/${motionSlug}` : null;

  const { data: amendments, error, mutate, isLoading } = useSWR<AmendmentList>(
    cacheKey,
    async (url: string) => {
      const token = await getToken();
      const response = await api.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Extract amendments from motion response
      return response.amendments || [];
    },
    {
      revalidateOnFocus,
      refreshInterval,
      errorRetryCount: 3,
      shouldRetryOnError: (error: any) => {
        return error?.status >= 500;
      },
    }
  );

  const refresh = async (): Promise<void> => {
    await mutate();
  };

  return {
    amendments,
    isLoading,
    error,
    mutate,
    refresh,
  };
}

/**
 * Hook for computing diffs between original text and amendments
 * Uses WebAssembly-powered diff computation for performance
 */
export function useAmendmentDiff(): UseAmendmentDiffReturn {
  const [diff, setDiff] = useState<DiffResult | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const diffWorkerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialize Web Worker for diff computation
    if (typeof window !== 'undefined') {
      diffWorkerRef.current = new Worker('/workers/diff-worker.js');
    }

    return () => {
      if (diffWorkerRef.current) {
        diffWorkerRef.current.terminate();
      }
    };
  }, []);

  const computeDiff = async (originalText: string, amendedText: string): Promise<DiffResult> => {
    if (!diffWorkerRef.current) {
      throw new Error('Diff worker not initialized');
    }

    setIsLoading(true);
    setError(undefined);

    return new Promise((resolve, reject) => {
      const worker = diffWorkerRef.current!;
      
      const handleMessage = (e: MessageEvent) => {
        const { type, data, error: workerError } = e.data;
        
        if (type === 'diff-result') {
          setDiff(data);
          setIsLoading(false);
          worker.removeEventListener('message', handleMessage);
          resolve(data);
        } else if (type === 'diff-error') {
          const error = new Error(workerError);
          setError(error);
          setIsLoading(false);
          worker.removeEventListener('message', handleMessage);
          reject(error);
        }
      };

      worker.addEventListener('message', handleMessage);
      
      // Send diff computation request to worker
      worker.postMessage({
        type: 'compute-diff',
        data: {
          originalText,
          amendedText,
          mode: 'line', // Use line-based diff for amendments
        },
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        worker.removeEventListener('message', handleMessage);
        const timeoutError = new Error('Diff computation timeout');
        setError(timeoutError);
        setIsLoading(false);
        reject(timeoutError);
      }, 10000);
    });
  };

  return {
    diff,
    isLoading,
    error,
    computeDiff,
  };
}

/**
 * Hook for managing amendment state and operations
 */
export function useAmendmentMutations(consultationPath: string, motionSlug: string) {
  const { getToken } = useAuth();

  const createAmendment = async (data: CreateAmendmentRequest): Promise<Amendment> => {
    const token = await getToken();
    return api.post(
      `/rest/${consultationPath}/motion/${motionSlug}/amendment`, 
      data, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
  };

  const updateAmendment = async (
    amendmentId: string, 
    data: UpdateAmendmentRequest
  ): Promise<Amendment> => {
    const token = await getToken();
    return api.put(
      `/rest/${consultationPath}/motion/${motionSlug}/amendment/${amendmentId}`, 
      data, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
  };

  const deleteAmendment = async (amendmentId: string): Promise<void> => {
    const token = await getToken();
    await api.delete(
      `/rest/${consultationPath}/motion/${motionSlug}/amendment/${amendmentId}`, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  };

  return {
    createAmendment,
    updateAmendment,
    deleteAmendment,
  };
}
