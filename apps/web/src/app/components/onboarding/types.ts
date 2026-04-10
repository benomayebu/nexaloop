export type MeResponse = {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  org: {
    id: string;
    name: string;
    onboardingComplete: boolean;
    industry?: string | null;
    supplierCount?: string | null;
    primaryConcern?: string | null;
  };
  role: string;
};
