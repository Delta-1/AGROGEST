import {useEffect,useState} from 'react';
import {MessageCircle,Save} from 'lucide-react';
import {useApp} from '../context';
import {supabase} from '../lib/backend';
import {defaultSite,readSite,whatsappUrl,type SiteContent} from '../lib/site';
import {Button,Field,SectionTitle} from './ui';

export function SiteContactSettings(){
 const {w,toast}=useApp();
 const [site,setSite]=useState<SiteContent>(defaultSite);
 const [revision,setRevision]=useState(0);
 const [loaded,setLoaded]=useState(false);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState('');
 const canEdit=w.member!.role==='admin';
 useEffect(()=>{let active=true;if(w.mode==='demo'){setLoaded(true);return}void readSite().then(result=>{if(active){setSite(result.content);setRevision(result.revision);setLoaded(true)}}).catch(()=>{if(active)setError('Não foi possível carregar o contato do site. Reabra esta aba para tentar novamente.')});return()=>{active=false}},[w.mode]);
 async function save(e:React.FormEvent){
  e.preventDefault();setError('');
  if(!canEdit)return;
  if(w.mode==='demo')return setError('A demonstração não altera o número publicado.');
  if(site.whatsapp.trim()&&!whatsappUrl(site.whatsapp))return setError('Confira o número com DDI e DDD.');
  setSaving(true);
  try{
   const payload={...site,whatsapp:site.whatsapp.trim(),whatsappConfigured:true};
   const result=await supabase!.from('site_content').update({payload}).eq('id','main').eq('revision',revision).select('revision').maybeSingle();
   if(result.error)throw Error('Não foi possível salvar o WhatsApp. Tente novamente.');
   if(!result.data)throw Error('O site foi alterado por outra pessoa. Reabra esta aba antes de salvar.');
   setSite(payload);setRevision(result.data.revision);toast('WhatsApp do site atualizado.');
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar.')}finally{setSaving(false)}
 }
 return <form className="card settings-card" onSubmit={e=>void save(e)}>
  <SectionTitle title="WhatsApp de atendimento do site" meta="Escolha o número para o qual os visitantes serão direcionados ao conversar com a Agrogest."/>
  <Field label="Número do WhatsApp" hint="Inclua o DDI e o DDD. Exemplo: +55 68 9605-5271.">
   <input type="tel" maxLength={25} disabled={!canEdit||!loaded} value={site.whatsapp} onChange={e=>setSite(s=>({...s,whatsapp:e.target.value}))}/>
  </Field>
  {whatsappUrl(site.whatsapp)&&<p className="notice"><MessageCircle size={18}/><span>Destino dos botões de contato: <strong>{site.whatsapp}</strong></span></p>}
  {!canEdit&&<p className="notice">A alteração do contato público é feita pelo administrador.</p>}
  {error&&<p className="error" role="alert">{error}</p>}
  {canEdit&&<div className="form-footer"><Button type="submit" disabled={!loaded||saving}><Save size={16}/>{saving?'Salvando…':'Salvar WhatsApp'}</Button></div>}
 </form>
}
