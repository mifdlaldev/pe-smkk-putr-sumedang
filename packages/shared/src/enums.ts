/** Domain enums — keep aligned with openspec + Drizzle schema. */

export const Role = {
  ADMIN: "ADMIN",
  SURVEYOR: "SURVEYOR",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const UserStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const ReportStatus = {
  draft: "draft",
  submitted: "submitted",
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const ReportType = {
  LAPORAN1: "LAPORAN1",
  LAPORAN2: "LAPORAN2",
  BOTH: "BOTH",
} as const;
export type ReportType = (typeof ReportType)[keyof typeof ReportType];

export const ApprovalType = {
  PEMERIKSA_1: "PEMERIKSA_1",
  PEMERIKSA_2: "PEMERIKSA_2",
  PEMERIKSA_3: "PEMERIKSA_3",
  PEMERIKSA_4: "PEMERIKSA_4",
  KONTRAKTOR: "KONTRAKTOR",
  PENGAWAS: "PENGAWAS",
  TIM_PELAKSANA: "TIM_PELAKSANA",
} as const;
export type ApprovalType = (typeof ApprovalType)[keyof typeof ApprovalType];

export const ProjectStatus = {
  draft: "draft",
  submitted: "submitted",
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];
