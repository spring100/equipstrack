import type { Status } from "@/components/StatusBadge";

export interface Equipment {
  id: string;
  name: string;
  category: string;
  location: string;
  status: Status;
  serialNumber: string;
  acquisitionDate: string;
  value: number;
}

export interface AuditEvent {
  id: string;
  date: string;
  type: "creation" | "maintenance" | "transfer" | "audit" | "decommission";
  description: string;
  user: string;
}

export const equipmentList: Equipment[] = [
  { id: "EQ-001", name: "Climatiseur Daikin FTXS35", category: "CVC", location: "Bâtiment A — Étage 2", status: "active", serialNumber: "DK-2024-FTXS-00142", acquisitionDate: "2024-01-15", value: 2850 },
  { id: "EQ-002", name: "Groupe électrogène CAT 500kVA", category: "Énergie", location: "Sous-sol technique", status: "active", serialNumber: "CAT-GEN-500K-87923", acquisitionDate: "2023-06-20", value: 45000 },
  { id: "EQ-003", name: "Ascenseur Otis Gen2", category: "Transport vertical", location: "Bâtiment B — Hall", status: "maintenance", serialNumber: "OT-G2-2023-FR-0047", acquisitionDate: "2023-03-10", value: 120000 },
  { id: "EQ-004", name: "Chaudière Viessmann Vitocrossal", category: "CVC", location: "Chaufferie centrale", status: "active", serialNumber: "VS-VTC-300-EU-1182", acquisitionDate: "2022-11-05", value: 18500 },
  { id: "EQ-005", name: "Système incendie Siemens FC726", category: "Sécurité", location: "Bâtiment A — RDC", status: "active", serialNumber: "SI-FC726-FR-03891", acquisitionDate: "2023-09-12", value: 8200 },
  { id: "EQ-006", name: "Pompe centrifuge Grundfos CR", category: "Plomberie", location: "Local technique B2", status: "storage", serialNumber: "GF-CR15-8-A-96501", acquisitionDate: "2021-04-18", value: 3400 },
  { id: "EQ-007", name: "Tableau électrique Schneider", category: "Énergie", location: "Bâtiment C — Sous-sol", status: "active", serialNumber: "SE-TGBT-400A-22087", acquisitionDate: "2022-07-22", value: 12000 },
  { id: "EQ-008", name: "Compresseur Atlas Copco GA30", category: "Air comprimé", location: "Atelier maintenance", status: "decommissioned", serialNumber: "AC-GA30-VSD-15632", acquisitionDate: "2019-02-14", value: 22000 },
];

export const auditEvents: AuditEvent[] = [
  { id: "AE-001", date: "2024-01-15", type: "creation", description: "Équipement enregistré dans le système", user: "Marie Dupont" },
  { id: "AE-002", date: "2024-03-22", type: "audit", description: "Inspection trimestrielle — conforme", user: "Jean Martin" },
  { id: "AE-003", date: "2024-06-10", type: "maintenance", description: "Remplacement du filtre et nettoyage complet", user: "Pierre Leroy" },
  { id: "AE-004", date: "2024-07-15", type: "transfer", description: "Transféré de Bâtiment A — Étage 1 vers Étage 2", user: "Marie Dupont" },
  { id: "AE-005", date: "2024-09-30", type: "audit", description: "Inspection trimestrielle — conforme, légère usure notée", user: "Jean Martin" },
  { id: "AE-006", date: "2025-01-08", type: "maintenance", description: "Maintenance préventive annuelle effectuée", user: "Pierre Leroy" },
];
