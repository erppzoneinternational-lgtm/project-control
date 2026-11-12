'use client';

import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import styles from './ResizableTable.module.css';

export function buildGuidelineStyle(clientX: number, tableRect: DOMRect): React.CSSProperties {
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 900;
  const clampedTop = Math.max(0, Math.round(tableRect.top));
  const clampedBottom = Math.min(viewportH, Math.round(tableRect.bottom));
  const clampedHeight = Math.max(24, clampedBottom - clampedTop);

  return {
    position: 'fixed',
    top: `${clampedTop}px`,
    height: `${clampedHeight}px`,
    left: `${Math.round(clientX)}px`,
    right: 'auto',
    width: '2px',
    minWidth: '2px',
    maxWidth: '2px',
    pointerEvents: 'none',
    zIndex: 100060,
  };
}

interface ResizableTableProps {
  tableId: string;
  children: React.ReactNode;
  className?: string;
  minColWidth?: number;
  maxColWidth?: number;
}

/**
 * Initializes resizable column behavior on a <table> DOM element.
 */
export function enhanceTableWithResize(
  table: HTMLTableElement,
  tableId: string,
  onShowGuideline?: (x: number, tableRect: DOMRect) => void,
  onHideGuideline?: () => void,
  minColWidth = 60,
  maxColWidth = 1400
) {
  table.dataset.resizableInit = 'true';

  const thead = table.querySelector('thead');
  if (!thead) return;

  const headerRows = thead.querySelectorAll('tr');
  if (!headerRows.length) return;
  const headerRow = headerRows[headerRows.length - 1];
  const ths = Array.from(headerRow.querySelectorAll('th')) as HTMLTableCellElement[];
  if (ths.length <= 1) return;

  const colgroup = table.querySelector('colgroup');
  const cols = colgroup ? Array.from(colgroup.querySelectorAll('col')) : [];

  const storageKey = `pzone_table_cols_${tableId}`;

  const loadSavedWidths = (): Record<number, number> => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const saveWidths = (widths: Record<number, number>) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(widths));
    } catch {
      // ignore
    }
  };

  const savedWidths = loadSavedWidths();

  const isRtl = () => {
    const dirAttrEl = table.closest('[dir]');
    if (dirAttrEl && dirAttrEl !== document.documentElement) {
      return dirAttrEl.getAttribute('dir')?.toLowerCase() === 'rtl';
    }
    if (typeof window !== 'undefined') {
      const contentDir = document.documentElement.dataset.contentDir;
      if (contentDir) {
        return contentDir.toLowerCase() === 'rtl';
      }
      const locale = document.documentElement.dataset.locale;
      if (locale) {
        return locale.toLowerCase() !== 'en';
      }
      return (
        window.getComputedStyle(table).direction === 'rtl' ||
        document.documentElement.dir === 'rtl' ||
        document.dir === 'rtl'
      );
    }
    return false;
  };

  ths.forEach((th, idx) => {
    // Apply saved width if available
    if (savedWidths[idx]) {
      th.style.width = `${savedWidths[idx]}px`;
      th.style.minWidth = `${savedWidths[idx]}px`;
      if (cols[idx]) {
        cols[idx].style.width = `${savedWidths[idx]}px`;
      }
    }

    // Skip if handle is already attached
    if (th.querySelector(`.${styles.resizeHandle}`)) {
      const existingHandle = th.querySelector(`.${styles.resizeHandle}`) as HTMLDivElement;
      if (savedWidths[idx]) {
        existingHandle.setAttribute('aria-valuenow', String(savedWidths[idx]));
      }
      return;
    }

    // Preserve sticky positioning if defined, otherwise ensure relative positioning for child handle
    const computedPos = window.getComputedStyle(th).position;
    if (computedPos === 'static') {
      th.style.position = 'relative';
    }

    const handle = document.createElement('div');
    const rtl = isRtl();
    handle.className = `${styles.resizeHandle} ${rtl ? styles.resizeHandleRtl : styles.resizeHandleLtr}`;

    // Accessibility attributes (WAI-ARIA separator pattern)
    handle.setAttribute('role', 'separator');
    handle.setAttribute('aria-orientation', 'vertical');
    handle.setAttribute('tabindex', '0');
    handle.setAttribute('aria-valuemin', String(minColWidth));
    handle.setAttribute('aria-valuemax', String(maxColWidth));

    const initialW = savedWidths[idx] || Math.round(th.getBoundingClientRect().width) || minColWidth;
    handle.setAttribute('aria-valuenow', String(initialW));

    const colTitle = th.textContent?.trim() || (rtl ? `العمود ${idx + 1}` : `Column ${idx + 1}`);
    handle.setAttribute(
      'aria-label',
      rtl
        ? `تغيير عرض عمود "${colTitle}" (استخدم مفاتيح الأسهم، انقر مرتين للضبط)`
        : `Resize column "${colTitle}" (use arrow keys, double-click to reset)`
    );
    handle.title = rtl
      ? `اسحب لتغيير عرض "${colTitle}" (انقر مرتين للضبط، أو استخدم الأسهم)`
      : `Drag to resize "${colTitle}" (double-click to reset, or use arrow keys)`;

    // Subtle hairline divider for resting state
    const divider = document.createElement('span');
    divider.className = styles.dividerLine;
    handle.appendChild(divider);

    // Grip icon (two subtle vertical bars ||)
    const grip = document.createElement('span');
    grip.className = styles.grip;
    grip.setAttribute('aria-hidden', 'true');
    const b1 = document.createElement('span');
    b1.className = styles.gripBar;
    const b2 = document.createElement('span');
    b2.className = styles.gripBar;
    grip.appendChild(b1);
    grip.appendChild(b2);
    handle.appendChild(grip);

    // Reset column width (shared by double-click and keyboard reset)
    const resetColWidth = () => {
      th.style.width = '';
      th.style.minWidth = '';
      if (cols[idx]) {
        cols[idx].style.width = '';
      }
      delete savedWidths[idx];
      saveWidths(savedWidths);
      handle.setAttribute('aria-valuenow', String(Math.round(th.getBoundingClientRect().width) || minColWidth));
      if (Object.keys(savedWidths).length === 0) {
        table.style.tableLayout = '';
      }
    };

    handle.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      resetColWidth();
    });

    // Prevent click on handle from triggering <th> onClick (e.g. column sort)
    handle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    // Keyboard navigation (Arrow keys, Home, End, Enter, Space, Delete)
    handle.addEventListener('keydown', (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' ', 'Delete', 'Backspace'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();

        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Delete' || e.key === 'Backspace') {
          resetColWidth();
          return;
        }

        const isCurrentlyRtl = isRtl();
        const currentW = Math.round(th.getBoundingClientRect().width);
        const step = e.shiftKey ? 30 : 10;
        const colMin = th.dataset.minWidth ? Math.max(minColWidth, parseInt(th.dataset.minWidth, 10)) : minColWidth;

        let targetW = currentW;
        if (e.key === 'ArrowRight') {
          targetW = isCurrentlyRtl ? currentW - step : currentW + step;
        } else if (e.key === 'ArrowLeft') {
          targetW = isCurrentlyRtl ? currentW + step : currentW - step;
        } else if (e.key === 'Home') {
          targetW = colMin;
        } else if (e.key === 'End') {
          targetW = Math.min(maxColWidth, 600);
        }

        const clampedW = Math.max(colMin, Math.min(maxColWidth, Math.round(targetW)));
        table.style.tableLayout = 'fixed';
        th.style.width = `${clampedW}px`;
        th.style.minWidth = `${clampedW}px`;
        if (cols[idx]) {
          cols[idx].style.width = `${clampedW}px`;
        }
        savedWidths[idx] = clampedW;
        saveWidths(savedWidths);
        handle.setAttribute('aria-valuenow', String(clampedW));

        // Visual guideline pulse on keyboard adjustment
        const thRect = th.getBoundingClientRect();
        const tableRect = table.getBoundingClientRect();
        const boundaryX = isCurrentlyRtl ? thRect.left : thRect.right;
        onShowGuideline?.(boundaryX, tableRect);
        setTimeout(() => {
          onHideGuideline?.();
        }, 350);
      }
    });

    let rafId: number | null = null;
    let activeTouchId: number | null = null;

    const onStartDrag = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const isTouch = 'touches' in e;
      if (isTouch) {
        if (e.touches.length === 0) return;
        activeTouchId = e.touches[0].identifier;
      }

      const startX = isTouch ? e.touches[0].clientX : e.clientX;
      const startWidth = th.getBoundingClientRect().width;
      const currentIsRtl = isRtl();

      // Freeze all current column widths to prevent sibling jitter when tableLayout becomes fixed
      const measuredWidths = ths.map((otherTh) => Math.round(otherTh.getBoundingClientRect().width));
      table.style.tableLayout = 'fixed';
      ths.forEach((otherTh, oIdx) => {
        if (!otherTh.style.width) {
          const w = measuredWidths[oIdx];
          otherTh.style.width = `${w}px`;
          otherTh.style.minWidth = `${w}px`;
          if (cols[oIdx]) {
            cols[oIdx].style.width = `${w}px`;
          }
          savedWidths[oIdx] = w;
        }
      });

      handle.classList.add(styles.resizeHandleActive);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';

      // Cache table rect at start of drag to avoid layout thrashing during mousemove
      const cachedTableRect = table.getBoundingClientRect();
      onShowGuideline?.(startX, cachedTableRect);

      let pendingX = startX;

      const updateResize = () => {
        rafId = null;
        const delta = currentIsRtl ? (startX - pendingX) : (pendingX - startX);
        const colMin = th.dataset.minWidth ? Math.max(minColWidth, parseInt(th.dataset.minWidth, 10)) : minColWidth;
        const newW = Math.max(colMin, Math.min(maxColWidth, Math.round(startWidth + delta)));

        th.style.width = `${newW}px`;
        th.style.minWidth = `${newW}px`;
        if (cols[idx]) {
          cols[idx].style.width = `${newW}px`;
        }
        savedWidths[idx] = newW;
        handle.setAttribute('aria-valuenow', String(newW));

        // Pin guideline exactly to the column boundary
        const effectiveDelta = newW - startWidth;
        const boundaryX = currentIsRtl ? Math.round(startX - effectiveDelta) : Math.round(startX + effectiveDelta);
        onShowGuideline?.(boundaryX, cachedTableRect);
      };

      const onMove = (moveEvt: MouseEvent | TouchEvent) => {
        let clientX: number;
        if ('touches' in moveEvt) {
          if (activeTouchId === null) return;
          let matchingTouch: Touch | null = null;
          for (let i = 0; i < moveEvt.touches.length; i++) {
            if (moveEvt.touches[i].identifier === activeTouchId) {
              matchingTouch = moveEvt.touches[i];
              break;
            }
          }
          if (!matchingTouch) return;
          clientX = matchingTouch.clientX;
        } else {
          clientX = moveEvt.clientX;
        }

        pendingX = clientX;
        if (rafId === null) {
          rafId = requestAnimationFrame(updateResize);
        }
      };

      const onEnd = (endEvt: MouseEvent | TouchEvent | FocusEvent) => {
        if ('touches' in endEvt && activeTouchId !== null) {
          let touchEnded = false;
          for (let i = 0; i < endEvt.changedTouches.length; i++) {
            if (endEvt.changedTouches[i].identifier === activeTouchId) {
              touchEnded = true;
              break;
            }
          }
          if (!touchEnded) return;
        }

        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
          updateResize();
        }

        activeTouchId = null;
        handle.classList.remove(styles.resizeHandleActive);
        onHideGuideline?.();
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        saveWidths(savedWidths);

        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onEnd);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onEnd);
        window.removeEventListener('touchcancel', onEnd);
        window.removeEventListener('blur', onEnd);
      };

      window.addEventListener('mousemove', onMove, { passive: false });
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onEnd);
      window.addEventListener('touchcancel', onEnd);
      window.addEventListener('blur', onEnd);
    };

    handle.addEventListener('mousedown', onStartDrag);
    handle.addEventListener('touchstart', onStartDrag, { passive: false });

    th.appendChild(handle);
  });
}

/**
 * ResizableTable component:
 * Wrapper for individual tables with dedicated boundary and guideline.
 */
export const ResizableTable: React.FC<ResizableTableProps> = ({
  tableId,
  children,
  className = '',
  minColWidth = 60,
  maxColWidth = 1400,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [guidelineStyle, setGuidelineStyle] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const table = container.querySelector('table');
    if (!table) return;

    const onShow = (clientX: number, tableRect: DOMRect) => {
      setGuidelineStyle(buildGuidelineStyle(clientX, tableRect));
    };

    const onHide = () => {
      setGuidelineStyle(null);
    };

    enhanceTableWithResize(table, tableId, onShow, onHide, minColWidth, maxColWidth);

    const observer = new MutationObserver(() => {
      enhanceTableWithResize(table, tableId, onShow, onHide, minColWidth, maxColWidth);
    });

    observer.observe(table, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [tableId, minColWidth, maxColWidth]);

  const guidelineNode = guidelineStyle ? (
    <div
      data-resize-guideline="true"
      aria-hidden="true"
      className={styles.guideLine}
      style={guidelineStyle}
    />
  ) : null;

  return (
    <div ref={containerRef} className={`${styles.resizableContainer} ${className}`}>
      {children}
      {guidelineNode && typeof document !== 'undefined'
        ? ReactDOM.createPortal(guidelineNode, document.body)
        : guidelineNode}
    </div>
  );
};

/**
 * GlobalTableResizeProvider:
 * Automatically equips ANY <table> rendered inside the application with resizable column handles (||).
 */
export const GlobalTableResizeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [guidelineStyle, setGuidelineStyle] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    const onShow = (clientX: number, tableRect: DOMRect) => {
      setGuidelineStyle(buildGuidelineStyle(clientX, tableRect));
    };

    const onHide = () => {
      setGuidelineStyle(null);
    };

    const scanAndEnhance = () => {
      const tables = Array.from(document.querySelectorAll('table')) as HTMLTableElement[];
      tables.forEach((table, index) => {
        // Skip explicitly ignored tables
        if (table.dataset.noResize === 'true') {
          return;
        }
        // Generate stable key from id, data-table-id, or page path + table index
        const tableId =
          table.id ||
          table.getAttribute('data-table-id') ||
          `${window.location.pathname.replace(/[^a-zA-Z0-9]/g, '_')}_tbl_${index}`;

        enhanceTableWithResize(table, tableId, onShow, onHide);
      });
    };

    scanAndEnhance();

    const observer = new MutationObserver(() => {
      scanAndEnhance();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  const guidelineNode = guidelineStyle ? (
    <div
      data-resize-guideline="true"
      aria-hidden="true"
      className={styles.guideLine}
      style={guidelineStyle}
    />
  ) : null;

  return (
    <>
      {children}
      {guidelineNode && typeof document !== 'undefined'
        ? ReactDOM.createPortal(guidelineNode, document.body)
        : guidelineNode}
    </>
  );
};

/**
 * useResizableTable hook:
 * Attach resizable columns directly to a table ref.
 */
export function useResizableTable<T extends HTMLTableElement = HTMLTableElement>({
  tableId,
  minColWidth = 60,
  maxColWidth = 1400,
}: {
  tableId: string;
  minColWidth?: number;
  maxColWidth?: number;
}) {
  const tableRef = useRef<T>(null);

  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;
    enhanceTableWithResize(table, tableId, undefined, undefined, minColWidth, maxColWidth);
  }, [tableId, minColWidth, maxColWidth]);

  return { tableRef };
}
