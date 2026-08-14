export type PropertyStatus = 'Available' | 'Pending' | 'Sold';
export type PropertyCategory = 'Houses' | 'Land & Plots' | 'Commercial';

export interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  category: PropertyCategory;
  status: PropertyStatus;
  image_url: string;
  beds: number;
  baths: number;
  size: string;
  description: string;
  created_at: string;
}

export type PropertyDraft = Omit<Property, 'id' | 'created_at'>;

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export interface SavedProperty {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
}
