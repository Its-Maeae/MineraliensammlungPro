// types/index.ts

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
  shelf_id?: number;  // Zeigt jetzt auf Box-ID (nicht mehr Regal-ID!)
  image_path?: string;
  created_at: string;
  shelf_code?: string;  // Box-Code (z.B. "A")
  showcase_code?: string;  // Hauptregal-Code (z.B. "R1")
  full_code?: string;  // Vollständiger Code (z.B. "R1-A")
}

// ALT: Showcase (Vitrine) - Wird zu MainShelf (Hauptregal)
// DEPRECATED: Wird schrittweise durch MainShelf ersetzt
export interface Showcase {
  id: number;
  name: string;
  code: string;
  location?: string;  // WICHTIG: Für Kompatibilität mit alten Components
  description?: string;
  image_path?: string;
  position_order: number;
  created_at: string;
  box_count?: number;  // Früher shelf_count
  shelf_count?: number;  // Alias für Kompatibilität
  mineral_count?: number;
  boxes?: Box[];  // Früher shelves
  shelves?: Shelf[];  // Alias für Kompatibilität mit alten Components
}

// NEU: MainShelf = Hauptregal (showcase_id IS NULL)
export interface MainShelf {
  id: number;
  name: string;
  code: string;
  location?: string;  // Optional: Physischer Standort
  description?: string;
  image_path?: string;
  position_order: number;
  created_at: string;
  box_count?: number;  // Anzahl der Boxen in diesem Hauptregal
  mineral_count?: number;  // Gesamtanzahl Mineralien in allen Boxen
  boxes?: Box[];  // Array der zugehörigen Boxen
}

// ALT: Shelf (Regal) - Wird zu Box
// NEU: Box (showcase_id zeigt auf MainShelf/Hauptregal)
export interface Shelf {
  id: number;
  name: string;
  code: string;
  showcase_id: number;  // Verweist auf Parent MainShelf ID
  description?: string;
  position_order: number;
  image_path?: string;
  created_at: string;
  showcase_name?: string;  // Name des Parent Hauptregals
  showcase_code?: string;  // Code des Parent Hauptregals (z.B. "R1")
  full_code?: string;  // Kombinierter Code (z.B. "R1-A")
  mineral_count?: number;
}

// NEU: Explizite Box-Schnittstelle (gleich wie Shelf, aber klarer benannt)
export interface Box {
  id: number;
  name: string;
  code: string;
  showcase_id: number;  // Parent Hauptregal ID
  description?: string;
  position_order: number;
  image_path?: string;
  created_at: string;
  shelf_name?: string;  // Name des Parent Hauptregals
  shelf_code?: string;  // Code des Parent Hauptregals (z.B. "R1")
  full_code?: string;  // Vollständiger Code (z.B. "R1-A")
  mineral_count?: number;  // Anzahl Mineralien in dieser Box
}

export interface Stats {
  total_minerals: number;
  total_locations: number;
  total_colors: number;
  total_shelves: number;  // Jetzt: Anzahl Hauptregale
  total_boxes?: number;  // NEU: Anzahl Boxen
}

export interface FilterOptions {
  colors: string[];
  locations: string[];
  rock_types: string[];
  shelves?: string[];  // Hauptregal-Codes
  boxes?: string[];  // Box-Codes (Full-Codes wie "R1-A")
}