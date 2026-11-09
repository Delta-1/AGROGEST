import {Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode} from 'react';
import {ArrowRight, Bell, CalendarDays, Check, CheckCheck, ChevronDown, ChevronRight, CircleHelp, Eye, EyeOff, FileCheck2, FileText, House, LandPlot, Leaf, LogOut, Menu, Search, Settings2, ShieldCheck, Sprout, Users, Workflow, X} from 'lucide-react';
import {AppContext} from './context';
import {useWorkspace} from './lib/useWorkspace';
import {supabase} from './lib/backend';
import {systemGuide} from './lib/guide';
import Auth from './components/Auth';
import Landing from './components/Landing';
import {Contacts} from './components/Contacts';
import {Team} from './components/Team';
import {SiteEditor} from './components/SiteEditor';
import Dashboard from './components/Dashboard';
import {Customers, CustomerDetail} from './components/Customers';
import {DocumentPage} from './components/Documents';
import {Processes} from './components/Processes';
import {Tasks, Certificates, Reports, SettingsPage} from './components/Office';
import {Avatar, Badge, Button, Empty, Loading} from './components/ui';
const Properties = lazy(()=>import('./components/Properties').then(m=>({default:m.Properties})));
const PropertyDetail = lazy(()=>import('./components/Properties').then(m=>({default:m.PropertyDetail})));
const Environment = lazy(()=>import('./components/Properties').then(m=>({default:m.Environment})));
const navigation = [
 {title:'Escritório',items:[{path:'home',name:'Visão geral',icon:House},{path:'producers',name:'Produtores',icon:Users},{path:'contacts',name:'Contatos',icon:Users},{path:'properties',name:'Imóveis rurais',icon:LandPlot},{path:'documents',name:'Documentos',icon:FileCheck2},{path:'processes',name:'Processos',icon:Workflow},{path:'tasks',name:'Agenda',icon:CalendarDays}]},
 {title:'Ferramentas',items:[{path:'certificates',name:'Certidões',icon:ShieldCheck},{path:'forms',name:'Laudos e formulários',icon:FileText},{path:'environment',name:'Ambiental',icon:Leaf}]},
 {title:'Gestão',items:[{path:'team',name:'Equipe',icon:Users},{path:'settings',name:'Configurações',icon:Settings2},{path:'website',name:'Site da empresa',icon:House}]}
];
function route(){return window.location.hash.slice(1)||(new URLSearchParams(window.location.search).has('preview')?'home':'site')}
export default function App(){
 const w=useWorkspace();
 const [path,setPath]=useState(route);
 const [modal,setModal]=useState<{title:string;content:ReactNode}|null>(null);
 const [message,setMessage]=useState('');
 const [query,setQuery]=useState('');
 const [searchOpen,setSearchOpen]=useState(false);
 const [panel,setPanel]=useState('');
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const searchRef=useRef<HTMLInputElement>(null);
 useEffect(()=>{if(new URLSearchParams(window.location.search).has('preview'))w.demo()},[]);
 useEffect(()=>{const update=()=>setPath(route());window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update)},[]);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 function close(){setModal(null)}
 function nav(to:string){window.location.hash=to;setPath(to);setPanel('');setSearchOpen(false);setQuery('');close();window.scrollTo({top:0,behavior:'instant'})}
 function toast(value:string){setMessage(value);clearTimeout(timer.current);timer.current=setTimeout(()=>setMessage(''),4500)}
 function open(title:string,content:ReactNode){setPanel('');setModal({title,content})}
 useEffect(()=>{const keys=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();searchRef.current?.focus();setSearchOpen(true)}if(e.key==='Escape'){setSearchOpen(false);setPanel('')}};window.addEventListener('keydown',keys);return()=>window.removeEventListener('keydown',keys)},[]);
 if(['site','sobre','servicos','equipe','contato'].includes(path))return <Landing onPortal={()=>nav('hub')}/>;
 if(!w.db||!w.member||w.recovery)return <AppContext.Provider value={{w,nav,toast,open,close}}>{w.busy?<Loading/>:<Auth/>}</AppContext.Provider>;
 const db=w.db;
 const root=path==='hub'?'home':path.split('/')[0];
 const active=navigation.flatMap(n=>n.items).find(i=>i.path===root);
 const reviews=db.documents.filter(d=>d.status!=='reviewed').length;
 const pendingTasks=db.tasks.filter(t=>!t.done);
 const results=[...db.customers.map(c=>({title:c.name,description:'Produtor · '+c.city,path:'producers/'+c.id,icon:Users})),...db.properties.map(p=>({title:p.name,description:'Imóvel rural · '+p.city,path:'properties/'+p.id,icon:LandPlot})),...navigation.flatMap(n=>n.items).map(i=>({title:i.name,description:'Ir para a página',path:i.path,icon:i.icon}))].filter(r=>r.title.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR'))).slice(0,7);
 function page(){switch(root){case 'home':return <Dashboard/>;case 'producers':return path.includes('/')?<CustomerDetail key={path} id={path.split('/')[1]}/>:<Customers/>;case 'properties':return path.includes('/')?<PropertyDetail key={path} id={path.split('/')[1]}/>:<Properties/>;case 'documents':return <DocumentPage/>;case 'processes':return <Processes/>;case 'tasks':return <Tasks/>;case 'certificates':return <Certificates/>;case 'forms':return <Reports/>;case 'environment':return <Environment/>;case 'contacts':return <Contacts/>;case 'website':return <SiteEditor/>;case 'team':return <Team/>;case 'settings':return <SettingsPage/>;default:return <Empty title="Vamos voltar ao escritório?" text="Esta página não está disponível." action={<Button onClick={()=>nav('home')}>Ir para visão geral</Button>}/>}}
 const link=(item:typeof navigation[0]['items'][number])=>item.path==='website'&&w.member!.role!=='admin'?null:<a key={item.path} href={'#'+item.path} onClick={e=>{e.preventDefault();nav(item.path)}} aria-current={root===item.path?'page':undefined} className={`topnav-item ${root===item.path?'active':''}`}><item.icon size={17}/><span>{item.name}</span>{item.path==='documents'&&reviews>0&&<b>{reviews}</b>}</a>;
 return <AppContext.Provider value={{w,nav,toast,open,close}}><div className="app-shell top-layout">
 <div className="main-shell">
  <header className="app-header"><div className="topbar"><button className="brand" onClick={()=>nav('home')} aria-label="AGROGEST — Visão geral"><img className="hub-brand-logo" src={`${import.meta.env.BASE_URL}assets/agrogest-logo-transparent.png`} alt="AGROGEST Assessoria"/></button><span className="brand-divider"/><div className="office-selector"><span><strong>Agrogest Hub</strong><small>Portal da equipe</small></span></div>
  <div className="global-search"><Search size={17}/><input ref={searchRef} aria-label="Buscar no escritório" placeholder="Buscar no escritório" value={query} onFocus={()=>setSearchOpen(true)} onBlur={()=>setTimeout(()=>setSearchOpen(false),150)} onChange={e=>{setQuery(e.target.value);setSearchOpen(true)}} onKeyDown={e=>{if(e.key==='Enter'&&results[0])nav(results[0].path)}}/><kbd>Ctrl K</kbd>{searchOpen&&<div className="search-results"><span>{query?'RESULTADOS DA BUSCA':'ACESSO RÁPIDO'}</span>{results.length?results.map(r=><button key={r.path} onMouseDown={e=>e.preventDefault()} onClick={()=>nav(r.path)}><r.icon size={18}/><span><strong>{r.title}</strong><small>{r.description}</small></span><ChevronRight size={14}/></button>):<p>Nenhum resultado encontrado.</p>}</div>}</div>
  <div className="topbar-actions"><span className="preview-badge"><i/>{w.mode==='demo'?'Demonstração':'Meu escritório'}</span><div className="popover-wrap"><button className="icon-btn notifications-button" aria-label="Notificações" aria-expanded={panel==='notifications'} onClick={()=>setPanel(panel==='notifications'?'':'notifications')}><Bell size={20}/>{reviews>0&&<i/>}</button>{panel==='notifications'&&<div className="top-popover"><h3>Sua atenção faz a diferença</h3><button onClick={()=>nav('documents')}><FileCheck2 size={20}/><span><strong>{reviews} documento{reviews===1?' para conferir':'s para conferir'}</strong><small>Revise antes de atualizar o cadastro.</small></span><ChevronRight size={15}/></button><button onClick={()=>nav('tasks')}><CalendarDays size={20}/><span><strong>{pendingTasks.length} demandas em aberto</strong><small>Organize os próximos passos da equipe.</small></span><ChevronRight size={15}/></button><button onClick={()=>nav('certificates')}><ShieldCheck size={20}/><span><strong>Acompanhe suas certidões</strong><small>Veja os prazos e comprovantes.</small></span><ChevronRight size={15}/></button></div>}</div><span className="topbar-divider"/><div className="popover-wrap"><button className="profile-button" aria-label="Menu do perfil" aria-expanded={panel==='profile'} onClick={()=>setPanel(panel==='profile'?'':'profile')}><Avatar name={w.member.name} small/><span><strong>{w.member.name}</strong><small>{w.member.role==='admin'?'Administrador':w.member.role==='gestor'?'Gestor':'Técnico'}</small></span><ChevronDown size={13}/></button>{panel==='profile'&&<div className="top-popover profile-popover"><h3>Seu espaço de trabalho</h3><button onClick={()=>nav('settings')}><Settings2 size={17}/>Configurações</button><button onClick={()=>nav('team')}><Users size={17}/>Minha equipe</button><button onClick={()=>nav('site')}><House size={17}/>Ver site da Agrogest</button><button onClick={()=>void w.refresh()}><CheckCheck size={17}/>Atualizar dados</button><button onClick={()=>void w.logout()}><LogOut size={17}/>{w.mode==='demo'?'Sair da demonstração':'Sair da conta'}</button></div>}</div><button className="icon-btn all-modules-toggle" aria-label="Todos os módulos" aria-expanded={panel==='modules'} onClick={()=>setPanel(panel==='modules'?'':'modules')}><Menu size={22}/></button></div></div>
  <div className="navigation-strip"><nav className="topnav" aria-label="Navegação principal">{navigation[0].items.map(link)}{navigation.slice(1).map(group=>{const selected=group.items.some(i=>i.path===root);return <div className="nav-dropdown" key={group.title}><button className={`topnav-item ${selected?'active':''}`} aria-expanded={panel===group.title} onClick={()=>setPanel(panel===group.title?'':group.title)}>{group.title==='Ferramentas'?<FileText size={17}/>:<Settings2 size={17}/>}<span>{selected?active?.name:group.title}</span><ChevronDown size={13}/></button>{panel===group.title&&<div className="navigation-menu"><span>{group.title}</span>{group.items.map(link)}</div>}</div>})}</nav><button className="nav-help" onClick={()=>open('Bem-vindo ao AGROGEST',<Help/>)}><CircleHelp size={17}/><span>Ajuda</span></button></div>
  {panel==='modules'&&<div className="all-modules-panel">{navigation.map(group=><div key={group.title}><span>{group.title}</span>{group.items.map(link)}</div>)}</div>}
  </header>
  <main id="main-content" className="page-content" onClick={()=>panel&&setPanel('')}><ErrorBoundary key={path}><Suspense fallback={<Loading/>}>{page()}</Suspense></ErrorBoundary></main>
  <div className="demo-status"><CheckCheck size={13}/>{w.saving?'Salvando…':w.mode==='demo'?'Demonstração · dados salvos neste navegador':'Dados da empresa · sincronizados com o servidor'}</div>
 </div></div>
 {modal&&<Modal key={modal.title} title={modal.title} onClose={close}>{modal.content}</Modal>}
 {message&&<div className="toast" role="status"><Check size={18}/><span>{message}</span><button className="icon-btn" aria-label="Fechar aviso" onClick={()=>setMessage('')}><X size={15}/></button></div>}
 {w.error&&<div className="global-error" role="alert">{w.error}<button onClick={()=>w.setError('')} aria-label="Fechar erro"><X size={15}/></button></div>}
 </AppContext.Provider>;
}
function Modal({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);
 const wide=title.includes('Conferência');
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const d=ref.current;d?.showModal();document.body.style.overflow='hidden';return()=>{document.body.style.overflow='';previous?.focus()}},[]);
 return <dialog ref={ref} className={`modal ${wide?'modal-wide':''}`} onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===e.currentTarget){const r=ref.current!.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose()}}} aria-labelledby="modal-title"><div className="modal-head"><div><span className="eyebrow">AGROGEST ASSESSORIA</span><h2 id="modal-title">{title}</h2></div><button className="icon-btn" aria-label="Fechar janela" onClick={onClose}><X size={21}/></button></div><div className="modal-body"><ErrorBoundary>{children}</ErrorBoundary></div></dialog>
}
function Help(){return <div className="help-content"><span className="help-leaf"><Sprout size={34}/></span><h2>Como o Agrogest Hub funciona</h2><p>Do primeiro contato à organização do trabalho da equipe.</p><ol>{systemGuide.map(section=><li key={section.title}><strong>{section.title}</strong><p>{section.text}</p></li>)}</ol><div className="notice"><Leaf size={19}/><span>OCR: até 12 páginas digitalizadas por arquivo e PDFs com até 150 páginas. Use arquivos nítidos e confira os dados antes de aplicar.</span></div></div>}

class ErrorBoundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true}}render(){return this.state.failed?<Empty title="Não foi possível abrir esta tela" text="Recarregue a página para tentar novamente." action={<Button onClick={()=>window.location.reload()}>Recarregar</Button>}/>:this.props.children}}
