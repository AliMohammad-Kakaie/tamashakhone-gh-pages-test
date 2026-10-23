import {createClient} from './supabase-vendor.mjs';
import {PROJECT_URL,PUBLISHABLE_KEY,BUILD} from './config.mjs';
export const auth=createClient(PROJECT_URL,PUBLISHABLE_KEY,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:'tamashakhone-real-auth-v1'},
  global:{fetch:(url,options)=>fetch(url,{...options,credentials:'omit',cache:'no-store',redirect:'error'})},
}).auth;
export async function api(route,{method='GET',body,token,signal}={}){
  const headers={apikey:PUBLISHABLE_KEY};if(token)headers.authorization='Bearer '+token;
  if(body)headers['Content-Type']='application/json';
  const r=await fetch(PROJECT_URL+'/functions/v1/tamashakhone-live/'+route,{method,headers,...(body?{body:JSON.stringify(body)}:{}),credentials:'omit',cache:'no-store',redirect:'error',signal});
  const data=await r.json().catch(()=>({error:'UNEXPECTED_RESPONSE'}));
  if(!r.ok)throw Object.assign(new Error(data.error||'CONNECTION_FAILED'),{status:r.status});
  return data;
}
export async function login(username,password){
  const data=await api('login',{method:'POST',body:{username,password}});
  if(data.build!==BUILD||typeof data.access_token!=='string'||typeof data.refresh_token!=='string')throw new Error('INVALID_SESSION_RESPONSE');
  const result=await auth.setSession({access_token:data.access_token,refresh_token:data.refresh_token});
  if(result.error)throw result.error;return result.data.session;
}
export async function restoreSession(){const {data,error}=await auth.getSession();if(error)throw error;return data.session;}
export async function loadProtectedArchive(){
  const session=await restoreSession();
  if(!session?.access_token)throw Object.assign(new Error('UNAUTHORIZED'),{status:401});
  try{return await api('archive',{token:session.access_token});}
  catch(e){if(e.status===401||e.status===403)dispatchEvent(new Event('tamashakhone-access-ended'));throw e;}
}
export async function logout(){
  let confirmed=false;
  try{const session=await restoreSession();if(session?.access_token){const data=await api('logout',{method:'POST',token:session.access_token});confirmed=data.revoked===true;}}
  finally{
    // The standard SDK clears its persisted session and broadcasts SIGNED_OUT,
    // including when the network request for signOut fails.
    const {error}=await auth.signOut({scope:'local'});
    if(!confirmed&&error)throw new Error('LOGOUT_NOT_CONFIRMED');
  }
  if(!confirmed)throw new Error('LOGOUT_NOT_CONFIRMED');
}
