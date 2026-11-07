import { createClient } from '@supabase/supabase-js';
import type {Collection, DB, Entity} from './domain';
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
// The visual preview never connects until the backend is deliberately enabled.
export const supabase=import.meta.env.VITE_ENABLE_BACKEND==='true'&&url&&key?createClient(url,key):null;
export const TABLES:Record<Collection,string>={customers:'customers',properties:'properties',herds:'herds',documents:'documents',processes:'processes',tasks:'tasks',certificates:'certificates',rules:'pending_rules',settings:'company_settings',audit:'audit_events'};
export type Member={companyId:string;userId:string;name:string;role:'admin'|'gestor'|'tecnico';companyName:string};
export async function memberships(userId:string):Promise<Member[]>{if(!supabase)return [];const {data,error}=await supabase.from('memberships').select('company_id,user_id,display_name,role,companies(name)').eq('user_id',userId).eq('active',true);if(error)throw error;return (data??[]).map((r:any)=>({companyId:r.company_id,userId:r.user_id,name:r.display_name,role:r.role,companyName:r.companies.name}));}
export async function loadRemote(companyId:string):Promise<DB>{if(!supabase)throw Error('Banco não configurado.');const results=await Promise.all(Object.entries(TABLES).map(async([key,table])=>{const {data,error}=await supabase!.from(table).select('id,payload').eq('company_id',companyId).order('created_at',{ascending:false});if(error)throw Error(`${table}: ${error.message}`);return [key,(data??[]).map(r=>({...r.payload,id:r.id}))]}));return Object.fromEntries(results) as DB;}
export function record(collection:Collection,entity:Entity,member:Member){const row:Record<string,unknown>={id:entity.id,company_id:member.companyId,payload:entity};if(!['rules','settings','audit'].includes(collection))row.owner_id=member.userId;if('customerId' in entity)row.customer_id=entity.customerId||null;if('propertyId' in entity)row.property_id=entity.propertyId||null;if(collection==='documents')row.sha256=(entity as DB['documents'][number]).hash;return row;}
export async function saveRemote(collection:Collection,entity:Entity,member:Member){const {error}=await supabase!.from(TABLES[collection]).upsert(record(collection,entity,member));if(error)throw Error(error.message);}
