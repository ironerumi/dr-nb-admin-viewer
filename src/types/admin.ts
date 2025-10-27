export interface FinalAccessLevel {
  entity: string;
  active: boolean;
  write: boolean;
  read: boolean;
  admin: boolean;
}

export interface AccountProfile {
  username: string;
  first_name: string;
  last_name: string;
  is_org_admin: boolean;
  final_access_levels: FinalAccessLevel[];
}

export type AdminMode = "admin" | "user" | "unknown";
