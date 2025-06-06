import { describe, it, expect } from 'vitest';
import { getSystemPrompt } from './prompts';

describe('getSystemPrompt', () => {
  it('should include project planning instructions in the system prompt', () => {
    const systemPrompt = getSystemPrompt();

    // Check for the main section header
    expect(systemPrompt).toContain('15. Project Planning:');

    // Check for file name and type
    expect(systemPrompt).toContain('create a detailed project plan in a Markdown file named \\`project-plan.md\\`');
    expect(systemPrompt).toContain('<boltAction type="file" filePath="project-plan.md">');

    // Check for content guidelines
    expect(systemPrompt).toContain('- **Goals**: Clearly define the objectives of the project.');
    expect(systemPrompt).toContain('- **Tasks**: Break down the project into smaller, manageable tasks.');
    expect(systemPrompt).toContain('- **Timeline**: Estimate a timeline for completing each task');

    // Check for placement advice
    expect(systemPrompt).toContain('This action should typically be one of the first actions in the artifact');
  });

  it('should still contain other critical sections, like system_constraints', () => {
    const systemPrompt = getSystemPrompt();
    expect(systemPrompt).toContain('<system_constraints>');
  });

  it('should still contain database_instructions', () => {
    const systemPrompt = getSystemPrompt();
    expect(systemPrompt).toContain('<database_instructions>');
  });

  it('should still contain artifact_instructions', () => {
    const systemPrompt = getSystemPrompt();
    expect(systemPrompt).toContain('<artifact_instructions>');
  });
});
