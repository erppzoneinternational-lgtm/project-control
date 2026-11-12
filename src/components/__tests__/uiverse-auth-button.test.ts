import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { UiverseAuthButton } from '../ui/UiverseAuthButton';

describe('UiverseAuthButton Component (Uiverse by Yaya12085)', () => {
  it('renders default Google auth button correctly', () => {
    const html = renderToString(React.createElement(UiverseAuthButton, { label: 'Continue with Google' }));
    expect(html).toContain('Continue with Google');
    expect(html).toContain('<svg');
  });

  it('renders loading state correctly', () => {
    const html = renderToString(React.createElement(UiverseAuthButton, {
      isLoading: true,
      loadingText: 'Connecting...',
    }));
    expect(html).toContain('Connecting...');
  });

  it('renders microsoft and github provider buttons with default labels', () => {
    const msHtml = renderToString(React.createElement(UiverseAuthButton, { provider: 'microsoft' }));
    expect(msHtml).toContain('Continue with Microsoft');

    const ghHtml = renderToString(React.createElement(UiverseAuthButton, { provider: 'github' }));
    expect(ghHtml).toContain('Continue with GitHub');
  });
});
