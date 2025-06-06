import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useStore } from '@nanostores/react';
import { Workbench, type WorkbenchViewType } from './Workbench.client'; // Ensure correct path
import { workbenchStore, type WorkbenchStore } from '~/lib/stores/workbench'; // Ensure correct path
import { StoreValues, MapStore } from 'nanostores';

// Mocks
vi.mock('~/components/ui/Slider', () => ({
  Slider: vi.fn(({ selected, options, setSelected }) => (
    <div data-testid="mocked-slider">
      {Object.entries(options).map(([key, option]: [string, any]) => (
        <button key={key} onClick={() => setSelected(option.value)}>
          {option.text}
        </button>
      ))}
    </div>
  )),
}));

vi.mock('./ProjectPlanDisplay', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="mocked-project-plan-display">Project Plan Display</div>),
}));

vi.mock('./EditorPanel', () => ({
  EditorPanel: vi.fn(() => <div data-testid="mocked-editor-panel">Editor Panel</div>),
}));
vi.mock('./DiffView', () => ({
  DiffView: vi.fn(() => <div data-testid="mocked-diff-view">Diff View</div>),
}));
vi.mock('./Preview', () => ({
  Preview: vi.fn(() => <div data-testid="mocked-preview">Preview</div>),
}));
vi.mock('~/lib/hooks', () => ({
  useViewport: vi.fn(() => false), // Default to not small viewport
}));
vi.mock('~/components/@settings/tabs/connections/components/PushToGitHubDialog', () => ({
  PushToGitHubDialog: vi.fn(() => null),
}));


// Mock ActionRunner
const mockActionRunner = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
} as any;

describe('Workbench.client.tsx', () => {
  const originalFetch = global.fetch;
  let initialStoreState: StoreValues<WorkbenchStore>;

  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn() as any;

    // Capture initial store state to reset it later
    // This is a simplified way; you might need a more robust store reset mechanism
    initialStoreState = {
      showWorkbench: workbenchStore.showWorkbench.get(),
      selectedFile: workbenchStore.selectedFile.get(),
      currentView: workbenchStore.currentView.get(),
      files: workbenchStore.files.get(),
      // ... other relevant store parts
    };

    // Reset relevant parts of the store
    workbenchStore.showWorkbench.set(true); // Default to visible for tests
    workbenchStore.currentView.set('code'); // Default view
    workbenchStore.files.set(new Map());
    workbenchStore.previews.set([]);
    workbenchStore.unsavedFiles.set(new Set());
    workbenchStore.currentDocument.set(undefined);

  });

  afterEach(() => {
    global.fetch = originalFetch;
    // Restore initial store state
    workbenchStore.showWorkbench.set(initialStoreState.showWorkbench);
    workbenchStore.selectedFile.set(initialStoreState.selectedFile);
    workbenchStore.currentView.set(initialStoreState.currentView);
    workbenchStore.files.set(initialStoreState.files);
    // ... restore other parts
  });

  const renderWorkbench = () => {
    return render(
      <Workbench
        chatStarted={true}
        isStreaming={false}
        actionRunner={mockActionRunner}
      />
    );
  };

  describe('Project Plan Feature', () => {
    it('Test 1 (Plan Exists): Renders "Project Plan" tab and component when project-plan.md exists', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('# Plan') }); // For project-plan.md check

      renderWorkbench();

      // Verify "Project Plan" tab is in Slider options
      await waitFor(() => {
        const slider = screen.getByTestId('mocked-slider');
        expect(slider).toHaveTextContent('Project Plan');
      });

      // Simulate selecting "Project Plan" tab
      // The actual store update might happen slightly differently based on Slider mock
      act(() => {
        workbenchStore.currentView.set('projectPlan' as any); // Cast because we extended the type locally
      });

      await waitFor(() => {
         // Check if ProjectPlanDisplay is rendered
        expect(screen.getByTestId('mocked-project-plan-display')).toBeInTheDocument();
      });

      // Ensure other views are not active (optional, but good for sanity)
      expect(screen.queryByTestId('mocked-editor-panel')).not.toBeVisible();
    });

    it('Test 2 (Plan Does Not Exist): Does NOT render "Project Plan" tab or component', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: false, status: 404 }); // For project-plan.md check

      renderWorkbench();

      // Verify "Project Plan" tab is NOT in Slider options
      await waitFor(() => {
        const slider = screen.getByTestId('mocked-slider');
        expect(slider).not.toHaveTextContent('Project Plan');
      });

      // Verify ProjectPlanDisplay is not rendered
      expect(screen.queryByTestId('mocked-project-plan-display')).not.toBeInTheDocument();

      // Default view (e.g., Code) should be active
      act(() => {
        workbenchStore.currentView.set('code');
      });
      await waitFor(() => {
        expect(screen.getByTestId('mocked-editor-panel')).toBeVisible();
      });
    });
  });
});
