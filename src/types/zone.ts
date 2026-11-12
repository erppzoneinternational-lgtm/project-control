export interface Zone {
  id: string;
  project_id: string;
  name_ar: string;
  name_en?: string | null;
  parent_zone_id?: string | null;
  sort_order: number;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  sub_zones?: Zone[];
}

export type ZoneInsert = Omit<Zone, 'id' | 'created_at' | 'updated_at' | 'sub_zones'>;
export type ZoneUpdate = Partial<Omit<Zone, 'id' | 'project_id' | 'created_at' | 'updated_at' | 'sub_zones'>>;
