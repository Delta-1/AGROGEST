import {DEFAULT_RULES,STAGE_DAYS,EMPTY_CUSTOMER,EMPTY_PROPERTY,today,type DB} from './domain';
const ago=(n:number)=>{const d=new Date();d.setDate(d.getDate()-n);return d.toISOString().slice(0,10)};
const ahead=(n:number)=>ago(-n);
export function seed():DB{return {
customers:[
 {id:'c1',...EMPTY_CUSTOMER,name:'Marcos Almeida',city:'Rio Branco',phone:'(68) 90000-0001',classification:'pronaf',responsible:'Ana Martins',address:'Ramal das Palmeiras, km 12',caf:'CAF demonstrativo',cafExpiry:ahead(180)},
 {id:'c2',...EMPTY_CUSTOMER,name:'Helena Costa',city:'Senador Guiomard',classification:'pronamp',responsible:'Ana Martins',address:'Estrada do Sol, km 8'},
 {id:'c3',...EMPTY_CUSTOMER,name:'João Ferreira',city:'Brasiléia',classification:'pronaf',responsible:'Rafael Lima'},
 {id:'c4',...EMPTY_CUSTOMER,name:'Lúcia Oliveira',city:'Xapuri',classification:'demais',responsible:'Rafael Lima',address:'Ramal Boa Vista, km 3'},
 {id:'c5',...EMPTY_CUSTOMER,name:'Pedro Nascimento',city:'Epitaciolândia',classification:'pronaf',responsible:'Ana Martins'},
 {id:'c6',...EMPTY_CUSTOMER,name:'Sofia Rodrigues',city:'Bujari',classification:'pronamp',responsible:'Rafael Lima'}],
properties:[
 {id:'p1',...EMPTY_PROPERTY,customerId:'c1',name:'Fazenda Boa Esperança',city:'Rio Branco',area:125,consolidated:92,tenure:'proprietario',car:'AC-1200401-'+ 'A'.repeat(32),incra:'Demonstração',registry:'1234 · exemplo',latitude:'-9.975',longitude:'-67.83'},
 {id:'p2',...EMPTY_PROPERTY,customerId:'c2',name:'Sítio Primavera',city:'Senador Guiomard',area:68,consolidated:48,tenure:'arrendatario',car:'AC-1200450-'+'B'.repeat(32)},
 {id:'p3',...EMPTY_PROPERTY,customerId:'c3',name:'Estância São João',city:'Brasiléia',area:42,consolidated:30},
 {id:'p4',...EMPTY_PROPERTY,customerId:'c4',name:'Fazenda Horizonte',city:'Xapuri',area:210,consolidated:160,tenure:'proprietario',car:'AC-1200708-'+'C'.repeat(32)},
 {id:'p5',...EMPTY_PROPERTY,customerId:'c5',name:'Sítio Água Clara',city:'Epitaciolândia',area:35,consolidated:20,tenure:'posse'},
 {id:'p6',...EMPTY_PROPERTY,customerId:'c6',name:'Recanto das Palmeiras',city:'Bujari',area:87,consolidated:61,tenure:'proprietario',car:'AC-1200138-'+'D'.repeat(32)}],
herds:[{id:'h1',customerId:'c1',propertyId:'p1',category:'Vacas adultas',heads:110,factor:1,date:today()},{id:'h2',customerId:'c2',propertyId:'p2',category:'Novilhas',heads:45,factor:.75,date:today()},{id:'h3',customerId:'c3',propertyId:'p3',category:'Bovinos adultos',heads:135,factor:1,date:today()}],
documents:[{id:'d1',customerId:'c1',propertyId:'p1',name:'CCIR · Boa Esperança (exemplo)',mime:'application/pdf',size:245760,hash:'demo-ccir',type:'ccir',status:'review',createdAt:ago(1),note:'Documento fictício. Confira a divergência de área: o cadastro tem 125 ha e o exemplo informa 128 ha.',fields:[{key:'name',label:'Denominação',target:'property',value:'Fazenda Boa Esperança',source:'Documento de exemplo · denominação',page:1,confidence:null,selected:true},{key:'area',label:'Área total (ha)',target:'property',value:'128',source:'Documento de exemplo · área total declarada: 128,00 ha',page:1,confidence:null,selected:false},{key:'incra',label:'Código INCRA',target:'property',value:'EXEMPLO-0001',source:'Documento de exemplo · código INCRA',page:1,confidence:null,selected:false}]},{id:'d2',customerId:'c2',propertyId:'p2',name:'CAR · Sítio Primavera (exemplo)',mime:'application/pdf',size:389120,hash:'demo-car',type:'car',status:'reviewed',createdAt:ago(3),fields:[]}],
processes:[
{id:'o1',customerId:'c1',title:'Custeio pecuário',bank:'Sicredi',amount:185000,type:'Custeio',stage:'Pendência',enteredAt:ago(9),responsible:'Ana Martins',notes:'Conferir a documentação do imóvel antes do envio.',history:[]},
{id:'o2',customerId:'c2',title:'Aquisição de matrizes',bank:'Banco da Amazônia',amount:240000,type:'Investimento',stage:'Elaboração',enteredAt:ago(6),responsible:'Ana Martins',notes:'Revisar orçamento analítico.',history:[]},
{id:'o3',customerId:'c3',title:'Manejo de pastagem',bank:'Banco do Brasil',amount:95000,type:'Custeio',stage:'Cadastro',enteredAt:ago(2),responsible:'Rafael Lima',notes:'Solicitar CAF e CAR.',history:[]},
{id:'o4',customerId:'c4',title:'Estrutura produtiva',bank:'Sicredi',amount:320000,type:'Investimento',stage:'Análise no banco',enteredAt:ago(8),responsible:'Rafael Lima',notes:'Aguardando retorno da agência.',history:[]},
{id:'o5',customerId:'c5',title:'Custeio agrícola',bank:'Banco do Brasil',amount:78000,type:'Custeio',stage:'Aprovação',enteredAt:ago(4),responsible:'Ana Martins',notes:'Confirmar assinatura do contrato.',history:[]},
{id:'o6',customerId:'c6',title:'Renovação de pastagem',bank:'Sicredi',amount:142000,type:'Investimento',stage:'Liberado',enteredAt:ago(12),responsible:'Rafael Lima',notes:'Operação demonstrativa concluída.',history:[]}],
tasks:[{id:'t1',title:'Conferir documentos de Marcos',customerId:'c1',due:today(),responsible:'Ana Martins',done:false,priority:'Alta'},{id:'t2',title:'Visita técnica · Sítio Primavera',customerId:'c2',due:ahead(2),responsible:'Ana Martins',done:false,priority:'Normal'},{id:'t3',title:'Solicitar atualização do CAF',customerId:'c3',due:today(),responsible:'Rafael Lima',done:false,priority:'Alta'}],
certificates:[{id:'ce1',customerId:'c1',type:'CND Imóvel Rural',expires:ahead(12),result:'Pendente de conferência',documentId:''},{id:'ce2',customerId:'c2',type:'Regularidade ambiental',expires:ago(2),result:'Pendente de conferência',documentId:''}],
rules:structuredClone(DEFAULT_RULES),settings:[{id:'settings',companyName:'AGROGEST Assessoria',office:'Rio Branco · Acre',maxStocking:4,referenceStocking:3,holidays:[],sourcePriority:['identity','registry','ccir','car','itr'],stageDays:{...STAGE_DAYS}}],audit:[]};}
