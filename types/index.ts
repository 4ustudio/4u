export interface NavLink {
  href: string;
  label: string;
  children?: { href: string; label: string; description?: string }[];
}

export interface Course {
  title: string;
  subtitle: string;
  status: string;
  color: string;
  icon: React.ReactNode;
  image?: string;
  description?: string;
  highlights?: string[];
  duration?: string;
  level?: string;
  instructorId?: string;
}

export interface PlanFeature {
  text: string;
}

export interface PlanCardProps {
  badge?: string;
  name: string;
  subtitle: string;
  price: string;
  priceNote?: string;
  description: string;
  features: PlanFeature[];
  instruments?: string[];
  highlighted: boolean;
}

export interface Instructor {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo?: string;
  photoPosition?: string;
  instrument: string;
  instrumentEmoji: string;
  experience?: string;
  achievements: string[];
  filterTags: string[];
  video_url?: string | null;
  specialties: string[];
  social?: {
    instagram?: string;
    youtube?: string;
  };
}

export interface Testimonial {
  id: string;
  name: string;
  age?: string;
  text: string;
  photo?: string;
  course?: string;
  rating: number;
}

export interface FAQ {
  question: string;
  answer: string;
  category: "general" | "planes" | "lecciones" | "kids";
}

export interface Benefit {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export interface Step {
  number: number;
  title: string;
  description: string;
}

export type ButtonVariant = "primary" | "secondary" | "whatsapp";
export type ButtonSize = "sm" | "md" | "lg";
