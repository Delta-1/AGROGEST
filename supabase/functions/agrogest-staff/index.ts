import {createClient} from 'npm:@supabase/supabase-js@2.119.0';
const allowedOrigins=['https://delta-1.github.io','http://localhost:5173','http://localhost:4173'];
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin')??'';
 const cors={'Access-Control-Allow-Origin':allowedOrigins.includes(origin)?origin:'https://delta-1.github.io','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
 const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(origin&&!allowedOrigins.includes(origin))return json({error:'Origem não autorizada.'},403);
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return json({error:'Método não permitido.'},405);
 const token=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'');
 if(!token)return json({error:'Entre na sua conta.'},401);
 const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:auth,error:authError}=await admin.auth.getUser(token);
 if(authError||!auth.user)return json({error:'Sessão inválida. Entre novamente.'},401);
 const actor=auth.user.id;
 const {data:profile,error:profileError}=await admin.from('staff_accounts').select('company_id,must_change_password').eq('user_id',actor).maybeSingle();
 if(profileError||!profile||profile.must_change_password)return json({error:'Acesso não autorizado.'},403);
 const {data:member}=await admin.from('memberships').select('role,active').eq('user_id',actor).eq('company_id',profile.company_id).maybeSingle();
 if(!member?.active||!['admin','gestor'].includes(member.role))return json({error:'Acesso exclusivo para o RH e administradores.'},403);
 try{
  const raw=await req.text();if(raw.length>8192)return json({error:'Solicitação muito grande.'},413);
  const body=JSON.parse(raw);const operation=String(body.operation??'');
  if(!['create','access','reset'].includes(operation))return json({error:'Operação inválida.'},400);
  const targetRole=String(body.role??'tecnico');
  if(!['admin','gestor','tecnico'].includes(targetRole)||(member.role==='gestor'&&targetRole!=='tecnico'))return json({error:'Perfil não autorizado.'},403);
  let target=String(body.userId??'');
  if(operation!=='create'){
   const {data:existing}=await admin.from('memberships').select('role').eq('company_id',profile.company_id).eq('user_id',target).maybeSingle();
   if(!existing||target===actor||(member.role==='gestor'&&existing.role!=='tecnico'))return json({error:'Você não pode alterar este acesso.'},403);
  }
  const password=String(body.password??'');
  if(operation!=='access'&&(password.length<12||password.length>128))return json({error:'A senha temporária precisa ter entre 12 e 128 caracteres.'},400);
  const username=String(body.username??'').trim().toLowerCase();const name=String(body.name??'').trim();
  if(operation==='create'){
   if(!/^[a-z][a-z0-9._-]{2,31}$/.test(username)||username==='admin'||name.length<2||name.length>100)return json({error:'Confira o nome e o login (3 a 32 letras, números, ponto, hífen ou sublinhado).'},400);
   const contactEmail=String(body.contactEmail??'').trim();
   if(contactEmail.length>254||(contactEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)))return json({error:'Confira o e-mail de contato.'},400);
   const {data:created,error}=await admin.auth.admin.createUser({email:username+'@acesso.agrogest.invalid',password,email_confirm:true});
   if(error||!created.user)return json({error:error?.code==='email_exists'?'Este login já está em uso.':'Não foi possível criar o login. Confira se ele já existe.'},400);
   target=created.user.id;
   const result=await admin.rpc('manage_agrogest_staff',{actor_id:actor,target_id:target,operation,login_name:username,full_name:name,target_role:targetRole,email_contact:contactEmail});
   if(result.error){await admin.auth.admin.deleteUser(target);return json({error:'Não foi possível vincular o acesso. Tente novamente.'},409)}
  }else{
   if(operation==='reset'){
    const changed=await admin.auth.admin.updateUserById(target,{password});
    if(changed.error)return json({error:'Não foi possível redefinir a senha.'},400);
   }
   const result=await admin.rpc('manage_agrogest_staff',{actor_id:actor,target_id:target,operation,target_role:targetRole,enabled:body.active!==false});
   if(result.error)return json({error:result.error.message},409);
  }
  return json({ok:true,userId:target,username:operation==='create'?username:undefined});
 }catch{return json({error:'Não foi possível concluir. Confira os dados e tente novamente.'},400)}
});
