const http=require('http');const fs=require('fs');const path=require('path');const crypto=require('crypto');
const ROOT=__dirname,PUBLIC=path.join(ROOT,'public'),DATA=process.env.DATA_DIR||path.join(ROOT,'data'),CONFIG=path.join(DATA,'site-config.json'),SEED=path.join(ROOT,'data','site-config.json'),BACKUPS=path.join(DATA,'backups');
const PORT=process.env.PORT||3000,ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||'',UPLOAD_TOKEN=process.env.UPLOAD_TOKEN||'',sessions=new Map();
fs.mkdirSync(DATA,{recursive:true});fs.mkdirSync(BACKUPS,{recursive:true});if(!fs.existsSync(CONFIG)&&fs.existsSync(SEED))fs.copyFileSync(SEED,CONFIG);
try{if(fs.existsSync(CONFIG)){const x=JSON.parse(fs.readFileSync(CONFIG,'utf8'));x.channels=x.channels||{};x.channels.main=x.channels.main||{};x.channels.sub=x.channels.sub||{};x.channels.main.name='차트서포터의 유튜브 HOT';x.channels.sub.name='의리코인의 유튜브 HOT';fs.writeFileSync(CONFIG,JSON.stringify(x,null,2),'utf8')}}catch(e){console.error('config migration failed',e)}
function send(res,status,body,type='text/plain; charset=utf-8'){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store'});res.end(body)}
function json(res,status,obj){send(res,status,JSON.stringify(obj),'application/json; charset=utf-8')}
function readBody(req){return new Promise((resolve,reject)=>{let d='';req.on('data',c=>{d+=c;if(d.length>2e6){reject(new Error('too large'));req.destroy()}});req.on('end',()=>resolve(d));req.on('error',reject)})}
function readBuffer(req){return new Promise((resolve,reject)=>{const chunks=[];let n=0;req.on('data',c=>{n+=c.length;if(n>3e6){reject(new Error('too large'));req.destroy();return}chunks.push(c)});req.on('end',()=>resolve(Buffer.concat(chunks)));req.on('error',reject)})}
function parseCookies(req){return Object.fromEntries((req.headers.cookie||'').split(';').filter(Boolean).map(v=>{const i=v.indexOf('=');return [v.slice(0,i).trim(),decodeURIComponent(v.slice(i+1))]}))}
function isAdmin(req){const t=parseCookies(req).freedom_admin;return t&&sessions.has(t)}
function mime(file){const e=path.extname(file).toLowerCase();return ({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'})[e]||'application/octet-stream'}
function serveFile(res,file){if(!fs.existsSync(file)||!fs.statSync(file).isFile())return false;res.writeHead(200,{'Content-Type':mime(file)});fs.createReadStream(file).pipe(res);return true}
function loadConfig(){return JSON.parse(fs.readFileSync(CONFIG,'utf8'))}
function saveConfig(obj){const stamp=new Date().toISOString().replace(/[:.]/g,'-');if(fs.existsSync(CONFIG))fs.copyFileSync(CONFIG,path.join(BACKUPS,`site-config-${stamp}.json`));const tmp=CONFIG+'.tmp';fs.writeFileSync(tmp,JSON.stringify(obj,null,2),'utf8');fs.renameSync(tmp,CONFIG)}
const server=http.createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost');const pathname=decodeURIComponent(u.pathname);
if(pathname==='/health')return json(res,200,{ok:true});
if(pathname==='/assets/orangex-visual.jpg'&&req.method==='GET')return serveFile(res,path.join(DATA,'orangex-visual.jpg'))||send(res,404,'Not found');
if(pathname==='/api/internal/orangex-image'&&req.method==='POST'){if(!UPLOAD_TOKEN||req.headers['x-upload-token']!==UPLOAD_TOKEN)return json(res,403,{error:'forbidden'});const buf=await readBuffer(req);fs.writeFileSync(path.join(DATA,'orangex-visual.jpg'),buf);return json(res,200,{ok:true,bytes:buf.length})}
if(pathname==='/api/config'&&req.method==='GET')return json(res,200,loadConfig());
if(pathname==='/api/admin/login'&&req.method==='POST'){if(!ADMIN_PASSWORD)return json(res,503,{error:'admin_password_not_configured'});const b=JSON.parse(await readBody(req)||'{}');if(b.password!==ADMIN_PASSWORD)return json(res,401,{ok:false});const t=crypto.randomBytes(24).toString('hex');sessions.set(t,Date.now());res.setHeader('Set-Cookie',`freedom_admin=${t}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.NODE_ENV==='production'?'; Secure':''}`);return json(res,200,{ok:true})}
if(pathname==='/api/admin/logout'&&req.method==='POST'){const t=parseCookies(req).freedom_admin;if(t)sessions.delete(t);res.setHeader('Set-Cookie','freedom_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return json(res,200,{ok:true})}
if(pathname==='/api/admin/config'){if(!isAdmin(req))return json(res,401,{error:'unauthorized'});if(req.method==='GET')return json(res,200,loadConfig());if(req.method==='PUT'){saveConfig(JSON.parse(await readBody(req)||'{}'));return json(res,200,{ok:true})}}
if(pathname.startsWith('/page/')){const slug=pathname.split('/').filter(Boolean)[1]||'';if(!['deposit','withdraw','trade','benefit'].includes(slug))return send(res,404,'Not found');const tpl=fs.readFileSync(path.join(PUBLIC,'pages','guide.html'),'utf8').replaceAll('__SLUG__',slug);return send(res,200,tpl,'text/html; charset=utf-8')}
if(pathname==='/admin'||pathname==='/admin/')return serveFile(res,path.join(PUBLIC,'admin.html'))||send(res,404,'Not found');
if(pathname==='/')return serveFile(res,path.join(PUBLIC,'index.html'))||send(res,404,'Not found');
const file=path.normalize(path.join(PUBLIC,pathname.replace(/^\//,'')));if(!file.startsWith(PUBLIC))return send(res,403,'Forbidden');if(serveFile(res,file))return;send(res,404,'Not found');
}catch(e){console.error(e);json(res,500,{error:'server_error'})}});
server.listen(PORT,()=>console.log(`FREEDOM site running on port ${PORT}`));
