import { useCallback, RefObject } from 'react';

type ContainerType = 'user-message' | 'action-message' | 'model-response' | 'buttons';

interface ViewportPosition {
  scrollTop: number;
  viewportHeight: number;
  scrollHeight: number;
}

export function useViewportPosition(containerRef: RefObject<HTMLDivElement>) {
  // Track current viewport state
  const getViewportState = useCallback((): ViewportPosition | null => {
    const container = containerRef.current;
    if (!container) return null;
    
    return {
      scrollTop: container.scrollTop,
      viewportHeight: container.clientHeight,
      scrollHeight: container.scrollHeight,
    };
  }, [containerRef]);

  // Find container by type and index using unique identifiers
  const findContainer = useCallback((containerType: ContainerType, index: number): HTMLElement | null => {
    const container = containerRef.current;
    if (!container) return null;
    
    return container.querySelector(
      `[data-container="${containerType}"][data-message-index="${index}"]`
    ) as HTMLElement | null;
  }, [containerRef]);

  // Scroll specific container to top of viewport
  const scrollContainerToTop = useCallback((
    containerType: ContainerType, 
    index: number, 
    offset: number = 24
  ) => {
    const container = containerRef.current;
    const element = findContainer(containerType, index);
    
    if (!container || !element) return;
    
    // Use offsetTop for position relative to scroll container
    const targetScroll = element.offsetTop - offset;
    container.scrollTo({ top: Math.max(0, targetScroll), behavior: 'instant' });
  }, [containerRef, findContainer]);

  // Scroll to bottom of content
  const scrollToBottom = useCallback((smooth: boolean = true) => {
    const container = containerRef.current;
    if (!container) return;
    
    container.scrollTo({ 
      top: container.scrollHeight, 
      behavior: smooth ? 'smooth' : 'instant' 
    });
  }, [containerRef]);

  // Check if element is visible in viewport
  const isContainerVisible = useCallback((containerType: ContainerType, index: number): boolean => {
    const container = containerRef.current;
    const element = findContainer(containerType, index);
    
    if (!container || !element) return false;
    
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    
    return (
      elementRect.top >= containerRect.top &&
      elementRect.bottom <= containerRect.bottom
    );
  }, [containerRef, findContainer]);

  return {
    getViewportState,
    findContainer,
    scrollContainerToTop,
    scrollToBottom,
    isContainerVisible,
  };
}
