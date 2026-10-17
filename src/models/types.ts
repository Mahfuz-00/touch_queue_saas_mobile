/** Shapes returned by the guest API (/api/v1/guest/*). */

export type TenantInfo = {
  subdomain: string;
  name: string;
  primary_language: string;
  secondary_language: string | null;
  show_secondary_language: boolean;
};

export type Branding = {
  name: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
};

export type GuestInit = {
  tenant: TenantInfo;
  branding: Branding;
  guest_join: { enabled: boolean; message: string | null };
};

export type Service = {
  id: number;
  name_en: string;
  name_secondary: string | null;
  acronym: string | null;
  provider_name_en: string | null;
  room_number: string | null;
};

export type LiveSnapshot = {
  status: string;
  full_token_no: string | null;
  serving_now: string | null;
  position: number;
  estimated_wait: number;
  served: boolean;
  missed: boolean;
};

export type JoinResponse = {
  key: string;
  live: LiveSnapshot;
};

export type TicketResponse = {
  live: LiveSnapshot;
  token: { full_token_no: string; party_size: number };
  category: { id: number; name_en: string; name_secondary: string | null };
};

export type JoinBody = {
  category_id: number;
  name: string;
  phone: string;
  party_size: number;
  is_reservation?: boolean;
  reservation_at?: string | null;
};

/** The clinic this session belongs to: its subdomain, and the host we call. */
export type TenantRef = {
  subdomain: string;
  host: string;
  name?: string;
};

export type HistoryEntry = {
  key: string;
  tenant: string;
  tenantHost: string;
  tokenNo: string;
  categoryName: string | null;
  status: string;
  createdAt: number;
};
