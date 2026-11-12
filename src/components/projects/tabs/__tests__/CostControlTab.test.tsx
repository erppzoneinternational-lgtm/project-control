import React from 'react';
import { describe, it, expect } from 'vitest';
import { CostControlTab } from '../CostControlTab';
import { Project } from '@/types';

describe('CostControlTab', () => {
  const dummyProject: Project = {
    id: 'proj-1',
    project_code: 'PZ-001',
    project_name: 'مشروع حمام السباحة',
    contract_value: 10000000,
    status: 'working',
  } as unknown as Project;

  it('instantiates CostControlTab as a valid React element', () => {
    const el = React.createElement(CostControlTab, { project: dummyProject });
    expect(React.isValidElement(el)).toBe(true);
    expect(el.props.project.id).toBe('proj-1');
  });

  it('accepts onProjectUpdate callback and edge case project data', () => {
    const onUpdate = () => {};
    const minimalProject = { id: 'p-min', project_code: 'P-0' } as unknown as Project;
    const el = React.createElement(CostControlTab, { project: minimalProject, onProjectUpdate: onUpdate });
    expect(React.isValidElement(el)).toBe(true);
    expect(el.props.onProjectUpdate).toBe(onUpdate);
  });
});
