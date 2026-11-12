'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ProjectService } from '@/lib/services/project.service';
import { Client, Stakeholder, StakeholderFull } from '@/types';
import { appCache } from '@/lib/cache';
import {
  NormalizedEntity,
  deduplicateEntities,
  deduplicatePeople,
  findCanonicalEntity,
} from '@/lib/directory/entityDirectory';

export interface UseStakeholderDirectoryResult {
  loading: boolean;
  rawClients: Client[];
  entities: NormalizedEntity[];
  owners: NormalizedEntity[];
  contractors: NormalizedEntity[];
  consultants: NormalizedEntity[];
  subcontractors: NormalizedEntity[];
  stakeholders: StakeholderFull[];
  employees: StakeholderFull[];
  clientReps: StakeholderFull[];
  consultantEngineers: StakeholderFull[];
  vendorReps: StakeholderFull[];
  refreshDirectory: () => Promise<void>;
  registerNewEntity: (client: Client) => NormalizedEntity | undefined;
  registerNewPerson: (person: Stakeholder | StakeholderFull) => StakeholderFull;
  resolveEntity: (idOrName?: string | null) => NormalizedEntity | undefined;
}

export function useStakeholderDirectory(autoLoad = true): UseStakeholderDirectoryResult {
  const [rawClients, setRawClients] = useState<Client[]>([]);
  const [rawStakeholders, setRawStakeholders] = useState<StakeholderFull[]>([]);
  const [loading, setLoading] = useState<boolean>(autoLoad);

  const refreshDirectory = useCallback(async () => {
    setLoading(true);
    try {
      const [clientsList, peopleList] = await Promise.all([
        ProjectService.getClients(),
        ProjectService.getStakeholdersDirectory({ kind: 'all' }).catch(() => [] as StakeholderFull[]),
      ]);
      setRawClients(clientsList || []);
      setRawStakeholders(peopleList || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      refreshDirectory();
    }
  }, [autoLoad, refreshDirectory]);

  const entities = useMemo(() => deduplicateEntities(rawClients), [rawClients]);
  const stakeholders = useMemo(() => deduplicatePeople(rawStakeholders), [rawStakeholders]);

  const owners = useMemo(
    () => entities.filter((e) => e.category === 'owner_developer'),
    [entities]
  );
  const contractors = useMemo(
    () => entities.filter((e) => e.category === 'main_contractor'),
    [entities]
  );
  const consultants = useMemo(
    () => entities.filter((e) => e.category === 'consultant'),
    [entities]
  );
  const subcontractors = useMemo(
    () => entities.filter((e) => e.category === 'subcontractor_vendor'),
    [entities]
  );

  const employees = useMemo(
    () => stakeholders.filter((s) => (s.stakeholder_kind || 'employee') === 'employee'),
    [stakeholders]
  );
  const clientReps = useMemo(
    () => stakeholders.filter((s) => s.stakeholder_kind === 'client_rep'),
    [stakeholders]
  );
  const consultantEngineers = useMemo(
    () => stakeholders.filter((s) => s.stakeholder_kind === 'external_expert'),
    [stakeholders]
  );
  const vendorReps = useMemo(
    () => stakeholders.filter((s) => s.stakeholder_kind === 'vendor_rep'),
    [stakeholders]
  );

  const registerNewEntity = useCallback((client: Client): NormalizedEntity | undefined => {
    appCache.invalidate('ref:clients');
    setRawClients((prev) => {
      const filtered = prev.filter((item) => item.id !== client.id);
      return [client, ...filtered];
    });
    const deduped = deduplicateEntities([client]);
    return deduped[0];
  }, []);

  const registerNewPerson = useCallback(
    (person: Stakeholder | StakeholderFull): StakeholderFull => {
      appCache.invalidate('ref:managers');
      appCache.invalidate('stakeholders:directory');
      const full: StakeholderFull = {
        organization_id: '00000000-0000-0000-0000-000000000001',
        stakeholder_kind: person.stakeholder_kind || 'employee',
        is_active: true,
        assigned_projects_count: 0,
        ...person,
        name_ar: person.name_ar || person.name_en || '',
      };
      setRawStakeholders((prev) => {
        const filtered = prev.filter((item) => item.id !== full.id);
        return [full, ...filtered];
      });
      return full;
    },
    []
  );

  const resolveEntity = useCallback(
    (idOrName?: string | null) => findCanonicalEntity(entities, idOrName),
    [entities]
  );

  return {
    loading,
    rawClients,
    entities,
    owners,
    contractors,
    consultants,
    subcontractors,
    stakeholders,
    employees,
    clientReps,
    consultantEngineers,
    vendorReps,
    refreshDirectory,
    registerNewEntity,
    registerNewPerson,
    resolveEntity,
  };
}
