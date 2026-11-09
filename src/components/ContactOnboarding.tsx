import {useEffect, useRef, useState} from 'react';
import {ArrowLeft, ArrowRight, Check, MessageCircle, Send} from 'lucide-react';
import {supabase} from '../lib/backend';
import {whatsappUrl} from '../lib/site';
import {ACTIVITIES, EMPTY_INTAKE, SERVICES, STAGES, STATES, URGENCIES, intakeRows, intakeSummary, readDemoIntakes, writeDemoIntakes, serializeIntake, validateIntake, validateIntakeContact, type IntakeAnswers, type IntakeContact} from '../lib/intake';

function Choices({title, name, options, value, onChange}: {title: string; name: string; options: Record<string, string>; value: string; onChange: (v: string) => void}) {
  return <fieldset className="intake-choices"><legend>{title}</legend>{Object.entries(options).map(([key, label]) => <label className={value === key ? 'selected' : ''} key={key}><input type="radio" name={name} value={key} checked={value === key} onChange={() => onChange(key)}/><span>{label}</span>{value === key && <Check size={16}/>}</label>)}</fieldset>;
}

export default function ContactOnboarding({whatsapp}: {whatsapp: string}) {
  const demo = new URLSearchParams(window.location.search).has('preview');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<IntakeAnswers>({...EMPTY_INTAKE});
  const [contact, setContact] = useState<IntakeContact>({name: '', phone: '', email: ''});
  const [website, setWebsite] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {if (firstRender.current) {firstRender.current = false; return;} heading.current?.focus({preventScroll: true});}, [step, done]);
  function update(key: keyof IntakeAnswers, value: string) {setAnswers(a => ({...a, [key]: value, ...(key === 'urgency' && value !== 'deadline' ? {deadline: ''} : {})})); setError('');}
  function next() {
    const issue = step < 2 ? validateIntake(answers, step) : validateIntakeContact(contact);
    if (issue) {setError(issue); return;}
    setError(''); setStep(s => Math.min(s + 1, 3));
  }
  async function send() {
    if (sending) return;
    const issue = validateIntake(answers) || validateIntakeContact(contact);
    if (issue) {setError(issue); return;}
    setSending(true); setError('');
    try {
      if (demo) {
        writeDemoIntakes([{...contact, id: crypto.randomUUID(), message: serializeIntake(answers), status: 'Novo', created_at: new Date().toISOString()}, ...readDemoIntakes()]);
        setDone(true); return;
      }
      if (!supabase) throw Error('O atendimento está temporariamente indisponível. Tente novamente em breve.');
      const result = await supabase.rpc('send_agrogest_message', {sender_name: contact.name.trim(), sender_phone: contact.phone.trim(), sender_email: contact.email.trim(), body: serializeIntake(answers), website});
      if (result.error) throw Error(result.error.message);
      setDone(true);
    } catch (e) {setError(e instanceof Error ? e.message : 'Não foi possível enviar. Suas respostas continuam aqui para tentar novamente.');}
    finally {setSending(false);}
  }
  const wa = whatsappUrl(whatsapp);
  const titles = ['Do que você precisa?', 'Um pouco sobre sua demanda.', 'Como podemos falar com você?', 'Confira sua solicitação.'];
  return <div className="site-contact-form intake-form">{done ? <div className="site-message-success" role="status"><span><Check size={32}/></span><h3 ref={heading} tabIndex={-1}>{demo?'Solicitação de demonstração salva.':'Sua solicitação chegou.'}</h3><p>{demo?'Disponível em Contatos → Solicitações do site da demonstração, somente neste navegador. Nenhum contato foi enviado à empresa.':'A equipe recebeu suas respostas e vai retornar pelo telefone ou e-mail informado.'}</p>{wa && !demo && <a className="site-primary" href={`${wa}?text=${encodeURIComponent(intakeSummary(answers) + '\nNome: ' + contact.name.trim())}`} target="_blank" rel="noreferrer">Continuar no WhatsApp<MessageCircle size={17}/></a>}<button className="intake-back" onClick={() => {setDone(false); setStep(0); setAnswers({...EMPTY_INTAKE}); setContact({name: '', phone: '', email: ''});}}>Iniciar outra solicitação</button></div> : <form noValidate onSubmit={e => {e.preventDefault(); if (step === 3) void send(); else next();}}>
    <span className="site-form-caption"><MessageCircle size={19}/>VAMOS ENTENDER SUA NECESSIDADE</span>
    {demo && <p className="site-data-note">Demonstração · use dados fictícios. Suas respostas ficam somente neste navegador.</p>}
    <div className="intake-progress" aria-label={`Etapa ${step + 1} de 4`}><span>Etapa {step + 1} de 4</span><span>{['Necessidade', 'Contexto', 'Contato', 'Revisão'][step]}</span><div>{[0, 1, 2, 3].map(i => <i key={i} className={i <= step ? 'complete' : ''}/>)}</div></div>
    <h3 ref={heading} tabIndex={-1}>{titles[step]}</h3>
    {step === 0 && <><p className="intake-intro">Responda algumas perguntas rápidas. Assim, nossa equipe já sabe como ajudar.</p><Choices title="Escolha o principal motivo do contato" name="service" options={SERVICES} value={answers.service} onChange={v => update('service', v)}/></>}
    {step === 1 && <><Choices title="Qual é a atividade?" name="activity" options={ACTIVITIES} value={answers.activity} onChange={v => update('activity', v)}/><label>Situação atual<select value={answers.stage} onChange={e => update('stage', e.target.value)}><option value="">Selecione uma opção</option>{Object.entries(STAGES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><div className="intake-location"><label>Município<input autoComplete="address-level2" maxLength={80} value={answers.city} onChange={e => update('city', e.target.value)} placeholder="Ex.: Brasiléia"/></label><label>UF<select autoComplete="address-level1" value={answers.state} onChange={e => update('state', e.target.value)}><option value="">UF</option>{STATES.map(uf => <option key={uf}>{uf}</option>)}</select></label></div><label>Quando precisa do atendimento?<select value={answers.urgency} onChange={e => update('urgency', e.target.value)}><option value="">Selecione uma opção</option>{Object.entries(URGENCIES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>{answers.urgency === 'deadline' && <label>Qual é o prazo? <small>(opcional)</small><input type="date" value={answers.deadline} onChange={e => update('deadline', e.target.value)}/></label>}</>}
    {step === 2 && <><p className="intake-intro">Usaremos estes dados para retornar sobre sua solicitação.</p><label>Seu nome<input name="name" autoComplete="name" maxLength={100} value={contact.name} onChange={e => setContact(c => ({...c, name: e.target.value}))}/></label><label>Telefone / WhatsApp com DDD<input name="phone" type="tel" autoComplete="tel" maxLength={30} placeholder="(68) 99999-0000" value={contact.phone} onChange={e => setContact(c => ({...c, phone: e.target.value}))}/></label><label>E-mail <small>(opcional)</small><input name="email" type="email" autoComplete="email" maxLength={254} value={contact.email} onChange={e => setContact(c => ({...c, email: e.target.value}))}/></label></>}
    {step === 3 && <><dl className="intake-summary">{[...intakeRows(answers), ['Nome', contact.name], ['Telefone', contact.phone], ...(contact.email ? [['E-mail', contact.email]] : [])].map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><p className="site-data-note">Ao enviar, suas respostas chegam à equipe da Agrogest para organizar e responder a este atendimento.</p></>}
    <label className="site-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)}/></label>
    {error && <p className="error" role="alert">{error}</p>}
    <div className="intake-actions">{step > 0 && <button className="intake-back" type="button" disabled={sending} onClick={() => {setStep(s => s - 1); setError('');}}><ArrowLeft size={16}/>Voltar</button>}<button className="site-primary" type="submit" disabled={sending}>{sending ? 'Enviando…' : step === 3 ? 'Enviar solicitação' : 'Continuar'}{step === 3 ? <Send size={17}/> : <ArrowRight size={17}/>}</button></div>
  </form>}</div>;
}
