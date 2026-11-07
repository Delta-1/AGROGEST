export type Versioned={revision?:number};
export type Role = 'admin'|'gestor'|'tecnico';
export type Customer = Versioned & {id:string; assignedTo?:string; name:string; cpf:string; phone:string; city:string; state:string; address:string; email:string; birthDate:string; maritalStatus:string; spouseName:string; spouseCpf:string; caf:string; cafExpiry:string; classification:string; responsible:string; notes:string};
export type Property = Versioned & {id:string; customerId:string; name:string; city:string; state:string; area:number; consolidated:number; car:string; incra:string; cib:string; registry:string; tenure:string; latitude:string; longitude:string; access:string; polygon?:{type:'Polygon';coordinates:number[][][]}};
export type Herd = Versioned & {id:string; customerId:string; propertyId:string; category:string; heads:number; factor:number; date:string};
export type FieldSuggestion = {key:string; label:string; target:'customer'|'property'; value:string; source:string; page:number; confidence:number|null; selected:boolean; original?:string};
export type Document = Versioned & {id:string; customerId:string; propertyId:string; name:string; mime:string; size:number; hash:string; type:string; status:'received'|'review'|'reviewed'|'error'; createdAt:string; storagePath?:string; fields:FieldSuggestion[]; note?:string};
export type Process = Versioned & {id:string; customerId:string; title:string; bank:string; amount:number; type:string; stage:string; enteredAt:string; responsible:string; notes:string; history:{at:string;from:string;to:string;by:string}[]};
export type Task = Versioned & {id:string;assignedTo?:string;title:string;customerId:string;due:string;responsible:string;done:boolean;priority:string};
export type Certificate = Versioned & {id:string;customerId:string;type:string;expires:string;result:string;documentId:string};
export type Rule = Versioned & {id:string;entity:'customer'|'property';field:string;label:string;severity:'blocking'|'attention';enabled:boolean;condition?:'pronaf'};
export type Settings = Versioned & {id:string;companyName:string;office:string;maxStocking:number;referenceStocking:number;holidays:string[];sourcePriority:string[];stageDays:Record<string,number>};
export type Audit = Versioned & {id:string;at:string;actor:string;action:string;entityId:string};
export type DB = {customers:Customer[];properties:Property[];herds:Herd[];documents:Document[];processes:Process[];tasks:Task[];certificates:Certificate[];rules:Rule[];settings:Settings[];audit:Audit[]};
export type Collection=keyof DB;
export type Entity=DB[Collection][number];
export const STAGES=['Cadastro','Elaboração','Análise no banco','Pendência','Aprovação','Liberado','Cancelado'];
export const STAGE_DAYS:Record<string,number>={'Cadastro':5,'Elaboração':3,'Análise no banco':10,'Pendência':3,'Aprovação':7};
export const DEFAULT_RULES:Rule[]=[
 {id:'r1',entity:'customer',field:'name',label:'Nome completo',severity:'blocking',enabled:true},
 {id:'r2',entity:'customer',field:'cpf',label:'CPF válido',severity:'blocking',enabled:true},
 {id:'r3',entity:'property',field:'name',label:'Nome do imóvel',severity:'blocking',enabled:true},
 {id:'r4',entity:'property',field:'city',label:'Município do imóvel',severity:'blocking',enabled:true},
 {id:'r5',entity:'property',field:'area',label:'Área total do imóvel',severity:'blocking',enabled:true},
 {id:'r6',entity:'property',field:'car',label:'Cadastro Ambiental Rural (CAR)',severity:'blocking',enabled:true},
 {id:'r7',entity:'property',field:'tenure',label:'Situação fundiária',severity:'blocking',enabled:true},
 {id:'r8',entity:'customer',field:'caf',label:'CAF para análise Pronaf',severity:'blocking',enabled:true,condition:'pronaf'},
 {id:'r9',entity:'customer',field:'address',label:'Endereço residencial',severity:'attention',enabled:true}
];
export const DOC_TYPES:Record<string,{label:string;fields:{key:string;label:string;target:'customer'|'property'}[]}>={
 identity:{label:'RG / CNH / CIN',fields:[{key:'name',label:'Nome completo',target:'customer'},{key:'cpf',label:'CPF',target:'customer'},{key:'birthDate',label:'Nascimento',target:'customer'}]},
 address:{label:'Comprovante de endereço',fields:[{key:'address',label:'Endereço',target:'customer'},{key:'city',label:'Município',target:'customer'},{key:'state',label:'UF',target:'customer'}]},
 marriage:{label:'Certidão de casamento',fields:[{key:'maritalStatus',label:'Estado civil',target:'customer'},{key:'spouseName',label:'Nome do cônjuge',target:'customer'},{key:'spouseCpf',label:'CPF do cônjuge',target:'customer'}]},
 caf:{label:'CAF / DAP',fields:[{key:'caf',label:'Número do CAF',target:'customer'},{key:'cafExpiry',label:'Validade',target:'customer'}]},
 ccir:{label:'CCIR / INCRA',fields:[{key:'incra',label:'Código INCRA',target:'property'},{key:'name',label:'Denominação',target:'property'},{key:'area',label:'Área total (ha)',target:'property'},{key:'city',label:'Município',target:'property'}]},
 car:{label:'CAR',fields:[{key:'car',label:'Número do CAR',target:'property'},{key:'area',label:'Área total (ha)',target:'property'},{key:'consolidated',label:'Área consolidada (ha)',target:'property'}]},
 registry:{label:'Matrícula / escritura',fields:[{key:'registry',label:'Matrícula',target:'property'},{key:'name',label:'Nome do imóvel',target:'property'},{key:'area',label:'Área total (ha)',target:'property'}]},
 itr:{label:'ITR / CIB',fields:[{key:'cib',label:'CIB / NIRF',target:'property'},{key:'area',label:'Área total (ha)',target:'property'}]},
 tenure:{label:'Contrato / vínculo fundiário',fields:[{key:'tenure',label:'Situação fundiária',target:'property'}]},
 herd:{label:'Ficha sanitária / rebanho',fields:[]},certificate:{label:'Certidão',fields:[]},other:{label:'Outro documento',fields:[]}
};
export const uid=()=>{if(crypto.randomUUID)return crypto.randomUUID();const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`};
export const digits=(s:string)=>s.replace(/\D/g,'');
export function validCpf(value:string){const s=digits(value);if(s.length!==11||/^(\d)\1+$/.test(s))return false;return [9,10].every(n=>{let sum=0;for(let i=0;i<n;i++)sum+=+s[i]*(n+1-i);return ((sum*10)%11)%10===+s[n]})}
export const maskCpf=(s:string)=>digits(s).length===11?`${digits(s).slice(0,3)}.***.***-${digits(s).slice(-2)}`:'Não informado';
export const validCar=(s:string)=>/^[A-Z]{2}-\d{7}-[A-F0-9]{32}$/i.test(s.trim());
export const number=(v:unknown)=>{const s=String(v??'').trim();return Number(s.includes(',')?s.replace(/\./g,'').replace(',','.'):s)||0};
export const money=(v:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(v);
export const area=(v:number)=>v.toLocaleString('pt-BR',{maximumFractionDigits:2});
export const dateLabel=(v:string)=>v?new Date(v.slice(0,10)+'T12:00:00').toLocaleDateString('pt-BR'):'Não informada';
export const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Rio_Branco'});
export function businessDays(start:string,end=today(),holidays:string[]=[]){let count=0;const a=new Date(start.slice(0,10)+'T12:00:00');const b=new Date(end.slice(0,10)+'T12:00:00');if(!Number.isFinite(+a)||!Number.isFinite(+b)||a>=b)return 0;while(a<b){a.setDate(a.getDate()+1);const iso=`${a.getFullYear()}-${String(a.getMonth()+1).padStart(2,'0')}-${String(a.getDate()).padStart(2,'0')}`;if(a.getDay()!==0&&a.getDay()!==6&&!holidays.includes(iso))count++}return count}
export function processDue(p:Process,s:Settings){const limit=s.stageDays[p.stage];return limit===undefined?null:limit-businessDays(p.enteredAt,today(),s.holidays)}
export function pending(c:Customer,properties:Property[],rules:Rule[]){const out:{label:string;severity:string;field:string}[]=[];for(const r of rules.filter(r=>r.enabled&&(!r.condition||c.classification==='pronaf'))){if(r.entity==='customer'){const v=c[r.field as keyof Customer];if(!v||(r.field==='cpf'&&!validCpf(String(v))))out.push({label:r.label,severity:r.severity,field:r.field})}else{if(!properties.length){if(!out.some(p=>p.field==='property'))out.push({label:'Vincular um imóvel rural',severity:'blocking',field:'property'});continue}for(const p of properties){const v=p[r.field as keyof Property];if(!v||(r.field==='area'&&Number(v)<=0)||(r.field==='car'&&!validCar(String(v))))out.push({label:`${r.label} · ${p.name||'Imóvel sem nome'}`,severity:r.severity,field:r.field})}}}return out}
export function stocking(properties:Property[],herds:Herd[],settings:Settings){const hectares=properties.reduce((a,p)=>a+p.consolidated,0);const units=herds.reduce((a,h)=>a+h.heads*h.factor,0);return {hectares,units,rate:hectares>0?units/hectares:null,blocked:hectares>0&&units/hectares>settings.maxStocking,missing:Math.max(0,units/settings.referenceStocking-hectares)}}
export function validateField(key:string,value:string){if(!value.trim())return 'Preencha o campo ou desmarque para não aplicar.';if(['cpf','spouseCpf'].includes(key)&&!validCpf(value))return 'CPF inválido. Confira os dígitos.';if(key==='car'&&!validCar(value))return 'Use UF-código IBGE-hash de 32 caracteres.';if(['area','consolidated'].includes(key)&&number(value)<=0)return 'Informe uma área maior que zero.';if(['birthDate','cafExpiry'].includes(key)&&!/^\d{4}-\d{2}-\d{2}$/.test(value))return 'Use a data no formato AAAA-MM-DD.';if(key==='birthDate'&&value>today())return 'Nascimento não pode estar no futuro.';if(key==='state'&&!/^[A-Z]{2}$/i.test(value))return 'Informe a UF com duas letras.';return ''}
export function validateProperty(p:Property){if(p.area<0||p.consolidated<0)return 'As áreas não podem ser negativas.';if(p.consolidated>p.area)return 'A área consolidada não pode superar a área total.';if(p.car&&!validCar(p.car))return 'CAR inválido. Use UF-código IBGE-hash.';if(p.latitude&&(!Number.isFinite(Number(p.latitude))||Math.abs(Number(p.latitude))>90))return 'Latitude inválida.';if(p.longitude&&(!Number.isFinite(Number(p.longitude))||Math.abs(Number(p.longitude))>180))return 'Longitude inválida.';return ''}
export const EMPTY_CUSTOMER:Omit<Customer,'id'>={name:'',cpf:'',phone:'',city:'',state:'AC',address:'',email:'',birthDate:'',maritalStatus:'',spouseName:'',spouseCpf:'',caf:'',cafExpiry:'',classification:'demais',responsible:'',notes:''};
export const EMPTY_PROPERTY:Omit<Property,'id'>={customerId:'',name:'',city:'',state:'AC',area:0,consolidated:0,car:'',incra:'',cib:'',registry:'',tenure:'',latitude:'',longitude:'',access:''};
