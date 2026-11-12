import type { WindowWithAtsmatrix } from '@/types/services-types';
﻿/**
 * ATSMATRIX Telemetry Bridge for Pzone Portal
 * Emits real-time agent/user events to local ATSMATRIX visualizer (http://localhost:8088/api/event)
 */

export interface AtsmatrixEvent {
  agent_id: string;
  action: 'MATCH' | 'VERIFY' | 'FLAG' | 'LINK' | 'SYNC' | 'FOUND' | 'PLAN' | 'EVENT';
  cluster?: 'DISCOVERY_HUB' | 'REASONING_ENGINE' | 'VERIFICATION_CORE' | 'SYNTHESIS_BROKER';
  message: string;
  payload?: Record<string, unknown>;
}

export async function emitAtsmatrixEvent(event: AtsmatrixEvent): Promise<void> {
  if (typeof window === 'undefined') return;

  const fullEvent = {
    timestamp: Date.now() / 1000,
    cluster: event.cluster || 'VERIFICATION_CORE',
    ...event,
  };

  try {
    // 1. In-browser direct hook if visualizer is open in same window/iframe
    if ((window as WindowWithAtsmatrix).atsmatrixEmit && typeof (window as WindowWithAtsmatrix).atsmatrixEmit === 'function') {
      (window as WindowWithAtsmatrix).atsmatrixEmit?.(fullEvent);
    }

    // 2. BroadcastChannel support for cross-tab communication
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('atsmatrix_events');
      channel.postMessage(fullEvent);
      channel.close();
    }

    // 3. Local HTTP Webhook Server (scripts/launch.py)
    fetch('http://localhost:8088/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullEvent),
      mode: 'cors',
    }).catch(() => {});
  } catch (_) {
    // Non-blocking telemetry
  }
}
