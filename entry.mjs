import {auth,login,logout,restoreSession} from './session.mjs';
const $=id=>document.getElementById(id);
let dashboard=null,epoch=0,currentUser=null,pendingUser=null;
const say=s=>$('authStatus').textContent=s;
function lock(message='برای دیدن آرشیو وارد شو.'){
  epoch++;currentUser=null;pendingUser=null;dashboard?.clearPrivateView();
  $('app').hidden=true;$('authPanel').hidden=false;$('password').value='';say(message);
}
async function open(session){
  if(!session){lock();return;}
  const user=session.user?.id;if(!user||currentUser===user||pendingUser===user)return;
  const version=++epoch;pendingUser=user;say('در حال دریافت آرشیو از مسیر محافظت‌شده…');
  try{
    dashboard??=await import('./dashboard-gh12.mjs');if(version!==epoch)return;
    const result=await dashboard.openDashboard();if(version!==epoch)return;
    if(result.status==='unauthorized'){lock('نشست یا مجوز معتبر نیست؛ دوباره وارد شو.');return;}
    currentUser=user;$('password').value='';$('authPanel').hidden=true;$('app').hidden=false;
  }catch{if(version===epoch)lock('ارتباط برقرار نشد. آرشیو نمایشی جایگزین اطلاعات واقعی نمی‌شود.');}
  finally{if(version===epoch)pendingUser=null;}
}
async function restore(){try{await open(await restoreSession());}catch{lock('بازیابی نشست ممکن نشد؛ ارتباط را بررسی کن یا دوباره وارد شو.');}}
$('loginForm').addEventListener('submit',async event=>{
  event.preventDefault();$('loginButton').disabled=true;say('در حال بررسی ورود…');
  try{const session=await login($('username').value,$('password').value);$('password').value='';await open(session);}
  catch(e){lock(e.message==='INVALID_CREDENTIALS'?'نام کاربری یا رمز درست نیست.':e.status===429?'تلاش‌ها بیش از حد مجاز است؛ ده دقیقه بعد دوباره امتحان کن.':e.message==='NOT_ACTIVATED'?'اتصال واقعی هنوز فعال نشده است.':e.status===400?'نام کاربری را با حروف انگلیسی وارد کن؛ ایمیل لازم نیست.':'ارتباط ورود برقرار نشد؛ داده‌ای جایگزین نمی‌شود.');}
  finally{$('password').value='';$('loginButton').disabled=false;}
});
$('logoutButton').addEventListener('click',async()=>{
  lock('اطلاعات صفحه پاک شد؛ در حال پایان‌دادن نشست…');
  try{await logout();say('خروج سمت سرور تأیید شد.');}catch{say('اطلاعات این مرورگر پاک شد، اما پایان نشست در سرور تأیید نشد؛ ارتباط را بررسی کن.');}
});
auth.onAuthStateChange((event,session)=>{
  if(event==='SIGNED_OUT')lock();
  else if(event==='SIGNED_IN'||event==='INITIAL_SESSION')queueMicrotask(()=>open(session));
});
addEventListener('tamashakhone-access-ended',()=>{lock('نشست یا مجوز پایان یافته است؛ دوباره وارد شو.');queueMicrotask(()=>auth.signOut({scope:'local'}));});
addEventListener('pagehide',()=>lock('در حال بررسی دوبارهٔ نشست…'));
addEventListener('pageshow',event=>{if(event.persisted)restore();});
await restore();
