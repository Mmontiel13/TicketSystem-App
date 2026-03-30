export type TicketType = "computo" | "impresora" | "red" | "otro";
export type TicketStatus = "Pendiente" | "En proceso" | "Terminada";
export type TicketPriority = "Alta" | "Media" | "Baja";

export interface Ticket {
  id: string;
  description: string;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  arrival_time: string; // ISO string
  max_wait_minutes: number;
  area: string;
  usuario: string;
}

// Arrival times spread across today so some are expired, some near, some fresh
const today = new Date();
const t = (minutesAgo: number) => {
  const d = new Date(today);
  d.setMinutes(d.getMinutes() - minutesAgo);
  return d.toISOString();
};

export const MOCK_TICKETS: Ticket[] = [
  {
    id: "TK-001",
    description: "Mi computadora no se enciende al presionar el botón de poder",
    type: "computo",
    priority: "Alta",
    status: "Pendiente",
    arrival_time: t(25),
    max_wait_minutes: 30,
    area: "Progra",
    usuario: "Karen",
  },
  {
    id: "TK-002",
    description: "La impresora del piso 3 no imprime documentos en color",
    type: "impresora",
    priority: "Media",
    status: "Terminada",
    arrival_time: t(45),
    max_wait_minutes: 60,
    area: "Progra",
    usuario: "Carlos",
  },
  {
    id: "TK-003",
    description: "Sin acceso a internet en toda el área de diseño",
    type: "red",
    priority: "Alta",
    status: "Pendiente",
    arrival_time: t(10),
    max_wait_minutes: 20,
    area: "Diseño",
    usuario: "María",
  },
  {
    id: "TK-004",
    description: "El software de nómina arroja error al generar reporte mensual",
    type: "otro",
    priority: "Alta",
    status: "En proceso",
    arrival_time: t(55),
    max_wait_minutes: 60,
    area: "RRHH",
    usuario: "Luis",
  },
  {
    id: "TK-005",
    description: "Pantalla parpadea constantemente en la laptop del director",
    type: "computo",
    priority: "Alta",
    status: "Pendiente",
    arrival_time: t(5),
    max_wait_minutes: 30,
    area: "Dirección",
    usuario: "Sofía",
  },
  {
    id: "TK-006",
    description: "No puedo conectarme a la VPN desde home office",
    type: "red",
    priority: "Media",
    status: "Pendiente",
    arrival_time: t(80),
    max_wait_minutes: 90,
    area: "Progra",
    usuario: "Karen",
  },
  {
    id: "TK-007",
    description: "La impresora de recepción atasca el papel constantemente",
    type: "impresora",
    priority: "Baja",
    status: "Terminada",
    arrival_time: t(120),
    max_wait_minutes: 120,
    area: "Recepción",
    usuario: "Ana",
  },
  {
    id: "TK-008",
    description: "El teclado y ratón inalámbrico dejaron de funcionar",
    type: "computo",
    priority: "Baja",
    status: "Pendiente",
    arrival_time: t(35),
    max_wait_minutes: 30,
    area: "Ventas",
    usuario: "Pedro",
  },
  {
    id: "TK-009",
    description: "El servidor de archivos compartidos no es accesible desde red local",
    type: "red",
    priority: "Alta",
    status: "Pendiente",
    arrival_time: t(15),
    max_wait_minutes: 20,
    area: "TI",
    usuario: "Jorge",
  },
  {
    id: "TK-010",
    description: "Outlook no sincroniza correos desde esta mañana",
    type: "otro",
    priority: "Media",
    status: "En proceso",
    arrival_time: t(40),
    max_wait_minutes: 60,
    area: "Administración",
    usuario: "Laura",
  },
];
