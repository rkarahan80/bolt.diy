import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ProjectPlanDisplay from './ProjectPlanDisplay';

// Mock the Markdown component
vi.mock('~/components/chat/Markdown', () => ({
  Markdown: ({ content }: { content: string }) => <div data-testid="mocked-markdown">{content}</div>,
}));

describe('ProjectPlanDisplay', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
    global.fetch = vi.fn() as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should display loading state initially', () => {
    (global.fetch as any).mockReturnValue(new Promise(() => {})); // Promise that never resolves
    render(<ProjectPlanDisplay />);
    expect(screen.getByText('Loading project plan...')).toBeInTheDocument();
  });

  it('should fetch and render markdown content successfully', async () => {
    const mockPlanContent = '# Project Plan\n- Task 1\n- Task 2';
    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockPlanContent),
    });

    render(<ProjectPlanDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('mocked-markdown')).toHaveTextContent(mockPlanContent);
    });
  });

  it('should display "No project plan found." if fetch returns 404', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
    });

    render(<ProjectPlanDisplay />);

    await waitFor(() => {
      expect(screen.getByText('No project plan found.')).toBeInTheDocument();
    });
  });

  it('should display an error message if fetch returns other error status', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    render(<ProjectPlanDisplay />);

    await waitFor(() => {
      expect(screen.getByText('Error: Error fetching project plan: 500 Internal Server Error')).toBeInTheDocument();
    });
  });

  it('should display an error message if fetch throws an error', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network Error'));

    render(<ProjectPlanDisplay />);

    await waitFor(() => {
      expect(screen.getByText('Error: Failed to fetch project plan: Network Error')).toBeInTheDocument();
    });
  });
});
