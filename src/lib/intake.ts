export const SERVICES = {
  credit: 'Crédito e projeto rural',
  documents: 'Organização de documentos',
  property: 'Imóvel e regularização rural',
  process: 'Acompanhar um processo',
  guidance: 'Preciso de orientação',
} as const;
export const ACTIVITIES = { livestock: 'Pecuária', crops: 'Agricultura', mixed: 'Atividade mista', undecided: 'Ainda não definido' } as const;
export const STAGES = { first: 'Primeiro atendimento', documents: 'Já tenho documentos', ongoing: 'Já tenho um processo em andamento', unsure: 'Não sei por onde começar' } as const;
export const URGENCIES = { planning: 'Estou me planejando', month: 'Quero avançar nos próximos 30 dias', deadline: 'Tenho um prazo próximo' } as const;
export const STATES = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
export type IntakeAnswers = {
  service: string; activity: string; stage: string; city: string; state: string; urgency: string; deadline: string;
};
export type IntakeContact = { name: string; phone: string; email: string };
export type SiteMessage = IntakeContact & {id: string; message: string; status: string; created_at: string};
export const DEMO_INTAKE_KEY = 'agrogest-demo-intakes-v1';
export function readDemoIntakes(): SiteMessage[] {
  try {const list = JSON.parse(localStorage.getItem(DEMO_INTAKE_KEY) || '[]'); return Array.isArray(list) ? list.filter(m => m && typeof m.id === 'string' && typeof m.message === 'string' && typeof m.name === 'string').slice(0,100) : [];} catch {return [];}
}
export function writeDemoIntakes(messages: SiteMessage[]) {localStorage.setItem(DEMO_INTAKE_KEY, JSON.stringify(messages.slice(0,100)));}
export const EMPTY_INTAKE: IntakeAnswers = { service: '', activity: '', stage: '', city: '', state: '', urgency: '', deadline: '' };
const has = (map: object, value: string) => Object.prototype.hasOwnProperty.call(map, value);
export function validateIntake(a: IntakeAnswers, step?: number): string {
  if ((step === undefined || step === 0) && !has(SERVICES, a.service)) return 'Selecione como podemos ajudar.';
  if (step === undefined || step === 1) {
    if (!has(ACTIVITIES, a.activity)) return 'Selecione a atividade.';
    if (!has(STAGES, a.stage)) return 'Selecione a situação atual.';
    if (a.city.trim().length < 2 || a.city.trim().length > 80) return 'Informe o município (de 2 a 80 caracteres).';
    if (!STATES.includes(a.state)) return 'Selecione a UF.';
    if (!has(URGENCIES, a.urgency)) return 'Selecione quando precisa do atendimento.';
    if (a.deadline && (!/^\d{4}-\d{2}-\d{2}$/.test(a.deadline) || !Number.isFinite(Date.parse(a.deadline)) || new Date(a.deadline).toISOString().slice(0, 10) !== a.deadline)) return 'Confira a data do prazo.';
  }
  return '';
}
export function validateIntakeContact(c: IntakeContact): string {
  if (c.name.trim().length < 2 || c.name.trim().length > 100) return 'Informe seu nome (de 2 a 100 caracteres).';
  const phone = c.phone.replace(/\D/g, '');
  if (!/^[+\d\s().-]+$/.test(c.phone) || phone.length < 10 || phone.length > 15 || c.phone.length > 30) return 'Informe um telefone com DDD para a equipe retornar.';
  if (c.email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim()) || c.email.length > 254)) return 'Confira o e-mail informado.';
  return '';
}
export function serializeIntake(a: IntakeAnswers): string {
  const error = validateIntake(a);
  if (error) throw Error(error);
  return JSON.stringify({ schema: 'agrogest.intake.v1', ...a, city: a.city.trim(), deadline: a.urgency === 'deadline' ? a.deadline : '' });
}
export function parseIntake(message: string): IntakeAnswers | null {
  try {
    const v = JSON.parse(message);
    if (!v || v.schema !== 'agrogest.intake.v1') return null;
    const keys = Object.keys(EMPTY_INTAKE) as (keyof IntakeAnswers)[];
    if (keys.some(k => typeof v[k] !== 'string')) return null;
    const a = Object.fromEntries(keys.map(k => [k, v[k]])) as IntakeAnswers;
    return validateIntake(a) ? null : a;
  } catch { return null; }
}
export function intakeRows(a: IntakeAnswers): [string, string][] {
  return [
    ['O que precisa', SERVICES[a.service as keyof typeof SERVICES]],
    ['Atividade', ACTIVITIES[a.activity as keyof typeof ACTIVITIES]],
    ['Situação atual', STAGES[a.stage as keyof typeof STAGES]],
    ['Localização', `${a.city} / ${a.state}`],
    ['Quando precisa', URGENCIES[a.urgency as keyof typeof URGENCIES]],
    ...(a.urgency === 'deadline' && a.deadline ? [['Prazo informado', a.deadline.split('-').reverse().join('/')] as [string, string]] : []),
  ];
}
export function intakeSummary(a: IntakeAnswers): string {
  return 'Solicitação pelo site da Agrogest\n' + intakeRows(a).map(([label, value]) => `${label}: ${value}`).join('\n');
}
