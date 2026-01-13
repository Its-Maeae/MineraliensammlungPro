export interface Mineral {
  id: number;
  name: string;
  number: string;
  color?: string;
  description?: string;
  location?: string;
  purchase_location?: string;
  latitude?: number;
  longitude?: number;
  rock_type?: string;
  shelf_id?: number;
  image_path?: string;
  created_at: string;
  shelf_code?: string;
  showcase_code?: string;
}

export interface Showcase {
  id: number;
  name: string;
  code: string;
  location?: string;
  description?: string;
  image_path?: string;
  created_at: string;
  shelf_count?: number;
  mineral_count?: number;
  shelves?: Shelf[];
}

export interface Shelf {
  id: number;
  name: string;
  code: string;
  showcase_id: number;
  description?: string;
  position_order: number;
  image_path?: string;
  created_at: string;
  showcase_name?: string;
  full_code?: string;
  mineral_count?: number;
}

export interface Stats {
  total_minerals: number;
  total_locations: number;
  total_colors: number;
  total_shelves: number;
}

export interface FilterOptions {
  colors: string[];
  locations: string[];
  rock_types: string[];
}