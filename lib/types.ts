export type Destination = {
  id: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
  altitude_m: number;
  best_season: string;
  overview: string;
  how_to_reach: string;
  activities: string[];
  safety: string;
  tips: string;
  cost_per_day_pkr: number;
  hidden_gem: boolean;
};

export type Guide = {
  id: string;
  name: string;
  company: string;
  title: string;
  region: string;
  districts: string[];
  phone: string;
  whatsapp: string;
  whatsapp_url: string;
  email: string;
  license: string;
  rating: number;
  reviews_count: number;
  experience_years: number;
  specialties: string[];
  languages: string[];
  bio: string;
  verified: boolean;
  daily_rate_pkr: number;
};

export type ChatMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ dest: string; section: string; label: string }>;
  created_at?: string;
};