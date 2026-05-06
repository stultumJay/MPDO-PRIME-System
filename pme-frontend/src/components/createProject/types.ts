export interface SectorOption {
  id: string;
  name: string;
  code: string;
}
export interface OfficeOption {
  id: string;
  name: string;
  code: string;
}
export interface ProgramOption {
  id: string;
  name: string;
  code: string;
  sector_id: string;
  office_id: string;
}

export interface WizardOptions {
  sectors: SectorOption[];
  offices: OfficeOption[];
  programs: ProgramOption[];
}

export interface WizardForm {
  project_title: string;
  project_description: string;
  barangay: string;
  street: string;
  sector_id: string;
  office_id: string;
  program_id: string;
  latitude?: number;
  longitude?: number;
}

export const BARANGAYS = [
  "Baybay",
  "Benigwayan",
  "Calatcat",
  "Lagtang",
  "Lanao",
  "Loguilo",
  "Lourdes",
  "Lumbo",
  "Molocboloc",
  "Poblacion",
  "Sampatulog",
  "Sungay",
  "Talaba",
  "Taparak",
  "Tugasnon",
  "Tula",
] as const;

export const SECTOR_META: Record<string, { icon: string; subtitle: string }> = {
  Infrastructure: { icon: "architecture", subtitle: "Physical Assets" },
  Social: { icon: "groups", subtitle: "Public Welfare" },
  Environmental: { icon: "eco", subtitle: "Sustainability" },
  Economic: { icon: "payments", subtitle: "Growth & Trade" },
  Institutional: { icon: "account_balance", subtitle: "Governance" },
  Others: { icon: "more_horiz", subtitle: "Uncategorized" },
};