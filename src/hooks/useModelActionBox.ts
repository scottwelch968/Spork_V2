import { useState, useRef, useCallback } from 'react';

export type ActionBoxStage = 'idle' | 'analyzing' | 'booting' | 'ready' | 'closed';

interface ModelInfo {
  modelId: string;
  modelName: string;
  isAuto: boolean;
  category?: string;
}

interface UseModelActionBoxReturn {
  stage: ActionBoxStage;
  modelInfo: ModelInfo | null;
  start: (modelId: string, modelName: string, isAuto: boolean) => void;
  setModelSelected: (actualModelId: string, actualModelName: string, category?: string) => void;
  close: () => void;
  reset: () => void;
}

const BOOT_DELAY_MS = 2000; // 2 second delay between booting and ready

export function useModelActionBox(): UseModelActionBoxReturn {
  const [stage, setStage] = useState<ActionBoxStage>('idle');
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  
  // Refs to track state and prevent race conditions
  const bootTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isClosedRef = useRef(false);
  const currentCycleRef = useRef(0); // Track message cycles to prevent stale updates

  // Clear any pending timers
  const clearTimers = useCallback(() => {
    if (bootTimerRef.current) {
      clearTimeout(bootTimerRef.current);
      bootTimerRef.current = null;
    }
  }, []);

  // Reset for new message cycle
  const reset = useCallback(() => {
    clearTimers();
    isClosedRef.current = false;
    currentCycleRef.current += 1;
    setStage('idle');
    setModelInfo(null);
  }, [clearTimers]);

  // Start the action box when user sends message
  const start = useCallback((modelId: string, modelName: string, isAuto: boolean) => {
    // Don't start if already closed in this cycle
    if (isClosedRef.current) return;
    
    clearTimers();
    
    setModelInfo({
      modelId,
      modelName,
      isAuto,
    });

    if (isAuto) {
      // Cosmo: Start with analyzing stage
      setStage('analyzing');
    } else {
      // Manual model: Skip to booting, then immediately schedule transition to ready
      setStage('booting');
      
      const cycle = currentCycleRef.current;
      bootTimerRef.current = setTimeout(() => {
        // Only update if still in same cycle
        if (currentCycleRef.current === cycle && !isClosedRef.current) {
          setStage('ready');
        }
      }, BOOT_DELAY_MS);
    }
  }, [clearTimers]);

  // Called when metadata arrives (for Cosmo) or immediately after start (for manual)
  const setModelSelected = useCallback((actualModelId: string, actualModelName: string, category?: string) => {
    // Don't update if already closed in this cycle
    if (isClosedRef.current) return;
    
    const cycle = currentCycleRef.current;
    
    // Update model info with actual values
    setModelInfo(prev => prev ? {
      ...prev,
      modelId: actualModelId,
      modelName: actualModelName,
      category: category || prev.category,
    } : {
      modelId: actualModelId,
      modelName: actualModelName,
      isAuto: true,
      category,
    });

    // Transition to booting stage (if was analyzing)
    setStage('booting');
    
    // Clear any existing timer and start new boot delay
    clearTimers();
    bootTimerRef.current = setTimeout(() => {
      // Only update if still in same cycle
      if (currentCycleRef.current === cycle && !isClosedRef.current) {
        setStage('ready');
      }
    }, BOOT_DELAY_MS);
  }, [clearTimers]);

  // Close the action box permanently for this message cycle
  const close = useCallback(() => {
    clearTimers();
    isClosedRef.current = true;
    setStage('closed');
  }, [clearTimers]);

  return {
    stage,
    modelInfo,
    start,
    setModelSelected,
    close,
    reset,
  };
}
