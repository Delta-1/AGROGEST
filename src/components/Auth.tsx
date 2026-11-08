import {useState} from 'react';
import {ArrowLeft,ArrowRight,Eye,EyeOff,ShieldCheck,Sprout} from 'lucide-react';
import {useApp} from '../context';
import {backendConfigured,supabase} from '../lib/backend';
import {Button} from './ui';
export default function Auth(){
 const {w,nav}=useApp();
 const [username,setUsername]=useState('');const [password,setPassword]=useState('');const [confirm,setConfirm]=useState('');
 const [show,setShow]=useState(false);const [remember,setRemember]=useState(true);const [working,setWorking]=useState(false);const [help,setHelp]=useState(false);const [error,setError]=useState('');
 async function submit(e:React.FormEvent){
  e.preventDefault();setError('');if(!supabase)return;setWorking(true);
  try{
   if(w.recovery){
    if(password.length<12)throw Error('Use uma senha com pelo menos 12 caracteres.');
    if(password!==confirm)throw Error('As senhas precisam ser iguais.');
    const result=await supabase.auth.updateUser({password});if(result.error)throw result.error;
    const completed=await supabase.rpc('complete_agrogest_password_change');if(completed.error)throw completed.error;
    w.setRecovery(false);if(w.user)await w.boot(w.user.id,w.user.email);
   }else await w.login(username,password,remember);
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível entrar. Tente novamente.')}finally{setWorking(false)}
 }
 return <div className="login-page hub-login">
  <div className="login-story"><div className="login-logo-surface"><img src={`${import.meta.env.BASE_URL}assets/agrogest-logo-transparent.png`} alt="AGROGEST Assessoria"/></div><span className="login-eyebrow">PESSOAS. CAMPO. CONQUISTAS.</span><h1>Todo o cuidado.<br/>Uma só equipe.<br/><em>Agrogest Hub.</em></h1><p>O espaço de trabalho da nossa equipe.<br/>Do primeiro contato ao próximo passo.</p><div className="login-field-lines" aria-hidden="true"/><small><Sprout size={18}/>Gestão com raízes no campo.</small></div>
  <div className="login-form-wrap"><button className="back-to-preview" onClick={()=>nav('site')}><ArrowLeft size={16}/>Voltar ao site</button><form onSubmit={e=>void submit(e)}>
   <span className="login-mark"><Sprout size={31}/></span><span className="eyebrow">PORTAL DA EQUIPE</span>
   <h2>{w.recovery?'Uma senha só sua.':'Acesse o Agrogest Hub.'}</h2>
   <p>{w.recovery?'Troque a senha temporária para continuar.':'Use o login e a senha fornecidos pelo RH.'}</p>
   {!w.recovery&&<label className="field"><span>Login</span><input required minLength={3} maxLength={32} autoComplete="username" placeholder="Seu nome de usuário" value={username} onChange={e=>setUsername(e.target.value)} autoCapitalize="none" spellCheck={false}/></label>}
   <label className="field"><span>{w.recovery?'Nova senha':'Senha'}</span><div className="password-field"><input required minLength={w.recovery?12:1} type={show?'text':'password'} autoComplete={w.recovery?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" aria-label={show?'Ocultar senha':'Mostrar senha'} onClick={()=>setShow(!show)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
   {w.recovery?<label className="field"><span>Confirmar nova senha</span><input required minLength={12} type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>:<div className="auth-options"><label className="check-label"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/>Manter conectado</label><button type="button" className="text-btn" onClick={()=>setHelp(!help)}>Preciso de ajuda</button></div>}
   {help&&<div className="notice">Fale com o RH ou com o administrador da Agrogest para receber seu login ou redefinir a senha. O acesso é criado pela empresa.</div>}
   {(error||w.error)&&<div className="error" role="alert">{error||w.error}</div>}
   {!backendConfigured&&<div className="notice">O portal está em configuração. Tente novamente em breve.</div>}
   <Button type="submit" disabled={!backendConfigured||working||w.busy}>{working?'Aguarde…':w.recovery?'Salvar senha e entrar':'Entrar no Hub'}<ArrowRight size={18}/></Button>
   {w.user&&!w.member&&<button type="button" className="text-btn" onClick={()=>void w.logout()}>Sair da conta</button>}
   <div className="login-preview-note"><ShieldCheck size={17}/><span>Acesso exclusivo para a equipe autorizada da AGROGEST.</span></div>
  </form><footer>AGROGEST Assessoria <span>·</span> Hub da equipe</footer></div>
 </div>
}
