import { supabase } from '../lib/supabase';

async function checkProjectStatus() {
  const { data: project, error } = await supabase
    .from('pm_projects')
    .select('*')
    .eq('project_code', '2412')
    .single();

  if (error) {
    console.error('Error querying project #2412:', error);
    return;
  }

  console.log('=== Database Record for Project #2412 ===');
  console.log('Project Code:', project.project_code);
  console.log('Project Name:', project.project_name);
  console.log('Status column value (status):', project.status);
  console.log('Last Updated At:', project.updated_at);
  console.log('All record keys:', Object.keys(project));
}

checkProjectStatus();
