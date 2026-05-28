export interface NavLink {
  href: string;
  label: string;
}

export interface Course {
  title: string;
  subtitle: string;
  status: string;
  color: string;
  icon: React.ReactNode;
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

export type ButtonVariant = "primary" | "secondary" | "whatsapp";
export type ButtonSize = "sm" | "md" | "lg";
