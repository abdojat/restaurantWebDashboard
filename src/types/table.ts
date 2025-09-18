export interface Table {
  id: number;
  name: string;
  name_ar: string;
  capacity: number;
  type: 'single' | 'double' | 'family' | 'special' | 'custom';
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  description?: string;
  description_ar?: string;
  is_active: boolean;
  image_path: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTableData {
  name: string;
  name_ar: string;
  capacity: number;
  type: 'single' | 'double' | 'family' | 'special' | 'custom';
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  description?: string;
  description_ar?: string;
  is_active: boolean;
}

export interface UpdateTableData extends Partial<CreateTableData> { }
