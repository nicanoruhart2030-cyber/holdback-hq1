/**
 * All copy, in English and Latin American Spanish.
 * Facts come only from the brief: no invented clients, results or credentials.
 */

export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];

export type CountryCode = "AR" | "CA" | "PE" | "UY" | "MX" | "CO" | "US" | "PR";
export type ServiceId = "mna" | "ops" | "core" | "ai";

type Service = { id: ServiceId; title: string; description: string; gets: readonly [string, string, string] };
type Step = { title: string; body: string };
type Role = { years: string; title: string; org?: string; detail?: string };

export type Dictionary = {
  meta: { title: string; description: string; ogAlt: string };
  nav: {
    services: string; experience: string; approach: string; about: string; testimonials: string; contact: string;
    book: string; menu: string; close: string; skip: string; language: string; home: string;
  };
  hero: { title: string; subtitle: string; primary: string; secondary: string; countriesLabel: string };
  stats: {
    label: string;
    years: string; countries: string; people: string; budget: string;
    budgetPrefix: string; budgetSuffix: string;
  };
  services: { title: string; intro: string; getsLabel: string; items: readonly [Service, Service, Service, Service] };
  experience: {
    title: string; intro: string; mapLabel: string; countriesHeading: string; now: string; nowTitle: string;
    countries: Record<CountryCode, string>;
    roles: Record<CountryCode, readonly Role[]>;
  };
  process: { title: string; intro: string; steps: readonly [Step, Step, Step, Step] };
  about: {
    title: string; paragraphs: readonly [string, string, string];
    languagesLabel: string; languages: string; linkedin: string; headshotAlt: string; headshotTodo: string;
  };
  testimonials: { title: string; todo: string };
  contact: {
    title: string; intro: string;
    name: string; company: string; email: string; service: string; servicePlaceholder: string; serviceOther: string;
    message: string; messagePlaceholder: string; optional: string;
    submit: string; sending: string; success: string; error: string; notConfigured: string;
    errors: { name: string; email: string; message: string; summary: string };
    direct: string; emailLabel: string; phoneLabel: string; linkedinLabel: string;
  };
  footer: { rights: string; backToTop: string };
  todo: { email: string; phone: string };
};

const en: Dictionary = {
  meta: {
    title: "GrowFitConsult | Banking integration, operations and modernization",
    description:
      "Fernando Uhart's consulting firm. Thirty years in banking, eight countries and SVP-led integrations, helping banks, fintechs and financial services companies get fit to grow.",
    ogAlt: "GrowFitConsult. Operations built to grow.",
  },
  nav: {
    services: "Services",
    experience: "Experience",
    approach: "Approach",
    about: "About",
    testimonials: "Testimonials",
    contact: "Contact",
    book: "Book a call",
    menu: "Menu",
    close: "Close",
    skip: "Skip to content",
    language: "Language",
    home: "GrowFitConsult, back to top",
  },
  hero: {
    title: "Operations built to grow.",
    subtitle:
      "Thirty years in banking, eight countries and SVP-led integrations across the Americas. GrowFitConsult helps banks, fintechs and financial services companies get fit to grow.",
    primary: "Book a call",
    secondary: "See experience",
    countriesLabel: "Work led in",
  },
  stats: {
    label: "At a glance",
    years: "years in banking",
    countries: "countries",
    people: "person organization led",
    budget: "operating budget managed",
    budgetPrefix: "$",
    budgetSuffix: "MM",
  },
  services: {
    title: "Four ways to get fit to grow.",
    intro:
      "Focused engagements, led personally by Fernando, for the moments that decide whether a financial institution scales or stalls.",
    getsLabel: "What you get",
    items: [
      {
        id: "mna",
        title: "M&A and post-merger integration",
        description:
          "Bring an acquired bank, portfolio or business onto your platform without losing customers, people or momentum, from day-one readiness to full conversion.",
        gets: ["Integration blueprint and governance", "Day-one and conversion readiness plans", "Synergy tracking tied to operations"],
      },
      {
        id: "ops",
        title: "Operations transformation",
        description:
          "Redesign how work gets done across back office and shared services, so cost, control and service improve together.",
        gets: ["Operating model and org design review", "Process and cost diagnostics", "A prioritized roadmap with owners"],
      },
      {
        id: "core",
        title: "Core banking modernization",
        description:
          "Move off legacy platforms in stages, with the controls, sequencing and change management a regulated institution needs.",
        gets: ["Modernization strategy and sequencing", "Vendor and architecture option review", "Migration and cutover planning"],
      },
      {
        id: "ai",
        title: "AI strategy and adoption",
        description:
          "Find where AI genuinely improves operations, then take it into production responsibly, with governance risk and compliance can sign off.",
        gets: ["Use-case assessment and prioritization", "Governance and risk guardrails", "A pilot-to-production rollout plan"],
      },
    ],
  },
  experience: {
    title: "Thirty years, eight countries.",
    intro:
      "Most of a career at Scotiabank, reaching Senior Vice President, followed by senior consulting for banks in the United States and Puerto Rico.",
    mapLabel: "Countries where Fernando has worked, in the order he worked there",
    countriesHeading: "Countries",
    now: "Now",
    nowTitle: "Founder",
    countries: {
      AR: "Argentina", CA: "Canada", PE: "Peru", UY: "Uruguay", MX: "Mexico", CO: "Colombia", US: "United States", PR: "Puerto Rico",
    },
    roles: {
      AR: [{ years: "1995–2003", title: "Administration Manager" }],
      CA: [
        { years: "2003–2004", title: "Director, Credit Card Conversions" },
        { years: "2005–2008", title: "Director, M&A Integrations" },
      ],
      PE: [
        { years: "2008–2010", title: "VP and Head of Integration" },
        { years: "2010–2011", title: "CEO, Shared Services" },
      ],
      UY: [{ years: "2011–2013", title: "AGM and Chief Administrative Officer" }],
      MX: [{ years: "2013–2018", title: "SVP, Head of Operations", detail: "2,400 FTEs · ~$200MM operating budget" }],
      CO: [{ years: "2018–2021", title: "SVP, Head of Integration and Modernization" }],
      US: [{ years: "2022–2023", title: "Senior Consultant", org: "Santander USA" }],
      PR: [{ years: "2024–2025", title: "Senior Consultant", org: "Nave Bank" }],
    },
  },
  process: {
    title: "How an engagement works.",
    intro: "Four stages, each with a clear output, so leadership always knows where the work stands.",
    steps: [
      { title: "Diagnose", body: "Interviews, data and a walk through the real operation. You get a clear read on where things stand and what matters most." },
      { title: "Plan", body: "A sequenced plan with owners, milestones and the decisions leadership needs to make, sized to your capacity." },
      { title: "Execute", body: "Hands-on leadership alongside your teams through delivery, keeping governance, risk and people aligned." },
      { title: "Hand off", body: "Documentation, metrics and trained owners, so the results hold after the engagement ends." },
    ],
  },
  about: {
    title: "About Fernando.",
    paragraphs: [
      "Fernando Uhart spent 30 years in banking, most of it at Scotiabank, where he rose to Senior Vice President. His work has centered on post-acquisition integrations, operations and bank modernization in more than eight countries.",
      "In Mexico he ran operations for an organization of 2,400 people with an operating budget of around $200 million, and in Colombia he led integration and modernization. Before that he held integration, shared services and administrative leadership roles in Argentina, Canada, Peru and Uruguay.",
      "He went on to work as a senior consultant for Santander USA and for Nave Bank in Puerto Rico, then founded GrowFitConsult to bring that experience to banks, fintechs and financial services companies that need to get fit to grow.",
    ],
    languagesLabel: "Languages",
    languages: "English and Spanish",
    linkedin: "View LinkedIn profile",
    headshotAlt: "Fernando Uhart",
    headshotTodo: "TODO: headshot photo",
  },
  testimonials: {
    title: "What clients say.",
    todo: "TODO: add a real, approved client quote",
  },
  contact: {
    title: "Tell Fernando what needs fixing.",
    intro: "Share a few details about the integration, operation or modernization in front of you, and Fernando will get back to you.",
    name: "Name",
    company: "Company",
    email: "Work email",
    service: "What do you need help with?",
    servicePlaceholder: "Choose one",
    serviceOther: "Something else",
    message: "Message",
    messagePlaceholder: "A few lines on the situation and the timing",
    optional: "optional",
    submit: "Send message",
    sending: "Sending",
    success: "Thank you. Your message is on its way to Fernando.",
    error: "The message could not be sent. Please try again, or reach Fernando on LinkedIn.",
    notConfigured: "The contact form is not connected yet. Please reach Fernando on LinkedIn.",
    errors: {
      name: "Please add your name.",
      email: "Please add a valid email address.",
      message: "Please add a short message.",
      summary: "Please check the highlighted fields.",
    },
    direct: "Or reach out directly",
    emailLabel: "Email",
    phoneLabel: "Phone",
    linkedinLabel: "LinkedIn",
  },
  footer: { rights: "All rights reserved.", backToTop: "Back to top" },
  todo: { email: "TODO: contact email", phone: "TODO: phone" },
};

const es: Dictionary = {
  meta: {
    title: "GrowFitConsult | Integración, operaciones y modernización bancaria",
    description:
      "La consultora de Fernando Uhart. Treinta años en banca, ocho países e integraciones lideradas a nivel SVP, para que bancos, fintechs y empresas de servicios financieros estén en forma para crecer.",
    ogAlt: "GrowFitConsult. Operaciones preparadas para crecer.",
  },
  nav: {
    services: "Servicios",
    experience: "Trayectoria",
    approach: "Cómo trabajamos",
    about: "Sobre Fernando",
    testimonials: "Testimonios",
    contact: "Contacto",
    book: "Agendar una llamada",
    menu: "Menú",
    close: "Cerrar",
    skip: "Ir al contenido",
    language: "Idioma",
    home: "GrowFitConsult, volver al inicio",
  },
  hero: {
    title: "Operaciones preparadas para crecer.",
    subtitle:
      "Treinta años en banca, ocho países e integraciones lideradas a nivel SVP en toda América. GrowFitConsult ayuda a bancos, fintechs y empresas de servicios financieros a ponerse en forma para crecer.",
    primary: "Agendar una llamada",
    secondary: "Ver trayectoria",
    countriesLabel: "Proyectos liderados en",
  },
  stats: {
    label: "En cifras",
    years: "años en banca",
    countries: "países",
    people: "personas en la organización que lideró",
    budget: "de presupuesto operativo a cargo",
    budgetPrefix: "US$",
    budgetSuffix: "MM",
  },
  services: {
    title: "Cuatro formas de ponerse en forma para crecer.",
    intro:
      "Proyectos acotados, liderados personalmente por Fernando, para los momentos que definen si una institución financiera escala o se estanca.",
    getsLabel: "Entregables",
    items: [
      {
        id: "mna",
        title: "Integración de M&A y post-fusión",
        description:
          "Incorporar un banco, una cartera o un negocio adquirido a su plataforma sin perder clientes, equipo ni impulso, desde la preparación para el día uno hasta la conversión completa.",
        gets: ["Plan maestro de integración y gobierno", "Planes de preparación para el día uno y la conversión", "Seguimiento de sinergias vinculado a la operación"],
      },
      {
        id: "ops",
        title: "Transformación de operaciones",
        description:
          "Rediseñar cómo se trabaja en el back office y los servicios compartidos, para que el costo, el control y el servicio mejoren a la vez.",
        gets: ["Revisión del modelo operativo y la estructura", "Diagnóstico de procesos y costos", "Una hoja de ruta priorizada, con responsables"],
      },
      {
        id: "core",
        title: "Modernización del core bancario",
        description:
          "Dejar atrás las plataformas heredadas por etapas, con los controles, la secuencia y la gestión del cambio que exige una institución regulada.",
        gets: ["Estrategia y secuencia de modernización", "Evaluación de proveedores y opciones de arquitectura", "Planificación de la migración y la puesta en producción"],
      },
      {
        id: "ai",
        title: "Estrategia y adopción de IA",
        description:
          "Identificar dónde la IA realmente mejora la operación y llevarla a producción de forma responsable, con un gobierno que riesgo y cumplimiento puedan aprobar.",
        gets: ["Evaluación y priorización de casos de uso", "Gobierno y resguardos de riesgo", "Un plan para pasar del piloto a producción"],
      },
    ],
  },
  experience: {
    title: "Treinta años, ocho países.",
    intro:
      "La mayor parte de su carrera en Scotiabank, donde llegó a Senior Vice President, y luego consultoría senior para bancos en Estados Unidos y Puerto Rico.",
    mapLabel: "Países donde trabajó Fernando, en el orden en que trabajó en ellos",
    countriesHeading: "Países",
    now: "Hoy",
    nowTitle: "Fundador",
    countries: {
      AR: "Argentina", CA: "Canadá", PE: "Perú", UY: "Uruguay", MX: "México", CO: "Colombia", US: "Estados Unidos", PR: "Puerto Rico",
    },
    roles: {
      AR: [{ years: "1995–2003", title: "Gerente de Administración" }],
      CA: [
        { years: "2003–2004", title: "Director, Conversiones de Tarjetas de Crédito" },
        { years: "2005–2008", title: "Director, Integraciones de M&A" },
      ],
      PE: [
        { years: "2008–2010", title: "VP y Head de Integración" },
        { years: "2010–2011", title: "CEO, Servicios Compartidos" },
      ],
      UY: [{ years: "2011–2013", title: "Gerente General Adjunto y Chief Administrative Officer" }],
      MX: [{ years: "2013–2018", title: "SVP, Head de Operaciones", detail: "2.400 colaboradores · presupuesto operativo de ~US$200 MM" }],
      CO: [{ years: "2018–2021", title: "SVP, Head de Integración y Modernización" }],
      US: [{ years: "2022–2023", title: "Consultor Senior", org: "Santander USA" }],
      PR: [{ years: "2024–2025", title: "Consultor Senior", org: "Nave Bank" }],
    },
  },
  process: {
    title: "Cómo funciona un proyecto.",
    intro: "Cuatro etapas, cada una con un resultado claro, para que la dirección sepa siempre en qué punto está el trabajo.",
    steps: [
      { title: "Diagnóstico", body: "Entrevistas, datos y un recorrido por la operación real. El resultado es una lectura clara de dónde se está y qué importa más." },
      { title: "Plan", body: "Un plan secuenciado con responsables, hitos y las decisiones que la dirección necesita tomar, a la medida de su capacidad." },
      { title: "Ejecución", body: "Liderazgo práctico junto a sus equipos durante la implementación, con el gobierno, el riesgo y las personas alineados." },
      { title: "Traspaso", body: "Documentación, métricas y responsables capacitados, para que los resultados se sostengan cuando el proyecto termina." },
    ],
  },
  about: {
    title: "Sobre Fernando.",
    paragraphs: [
      "Fernando Uhart trabajó 30 años en banca, la mayor parte en Scotiabank, donde llegó a Senior Vice President. Su carrera se centró en integraciones post-adquisición, operaciones y modernización bancaria en más de ocho países.",
      "En México dirigió las operaciones de una organización de 2.400 personas con un presupuesto operativo de alrededor de US$200 millones, y en Colombia lideró la integración y la modernización. Antes ocupó cargos de liderazgo en integración, servicios compartidos y administración en Argentina, Canadá, Perú y Uruguay.",
      "Después trabajó como consultor senior para Santander USA y para Nave Bank en Puerto Rico, y fundó GrowFitConsult para poner esa experiencia al servicio de bancos, fintechs y empresas de servicios financieros que necesitan ponerse en forma para crecer.",
    ],
    languagesLabel: "Idiomas",
    languages: "Inglés y español",
    linkedin: "Ver perfil de LinkedIn",
    headshotAlt: "Fernando Uhart",
    headshotTodo: "TODO: foto de Fernando",
  },
  testimonials: {
    title: "Lo que dicen los clientes.",
    todo: "TODO: agregar una cita real y aprobada de un cliente",
  },
  contact: {
    title: "Cuéntele a Fernando qué hay que resolver.",
    intro: "Comparta algunos detalles sobre la integración, la operación o la modernización que tiene por delante, y Fernando se pondrá en contacto.",
    name: "Nombre",
    company: "Empresa",
    email: "Email corporativo",
    service: "¿En qué necesita ayuda?",
    servicePlaceholder: "Elija una opción",
    serviceOther: "Otro tema",
    message: "Mensaje",
    messagePlaceholder: "Unas líneas sobre la situación y los plazos",
    optional: "opcional",
    submit: "Enviar mensaje",
    sending: "Enviando",
    success: "Gracias. Su mensaje ya está en camino a Fernando.",
    error: "No se pudo enviar el mensaje. Intente de nuevo o escríbale a Fernando por LinkedIn.",
    notConfigured: "El formulario todavía no está conectado. Escríbale a Fernando por LinkedIn.",
    errors: {
      name: "Agregue su nombre.",
      email: "Agregue un email válido.",
      message: "Agregue un mensaje breve.",
      summary: "Revise los campos marcados.",
    },
    direct: "O escriba directamente",
    emailLabel: "Email",
    phoneLabel: "Teléfono",
    linkedinLabel: "LinkedIn",
  },
  footer: { rights: "Todos los derechos reservados.", backToTop: "Volver arriba" },
  todo: { email: "TODO: email de contacto", phone: "TODO: teléfono" },
};

export const dictionaries: Record<Locale, Dictionary> = { en, es };
