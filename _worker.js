/**
 * CineWorld Clips v4 — Cloudflare Pages Worker
 * Complete backend: Auth, Movies, Admin, Media, Payments
 * All /api/* routes handled here. Fallback to static assets.
 */

// ═══════════════ JWT (Web Crypto) ═══════════════

function b64e(b) { return btoa(String.fromCharCode(...new Uint8Array(b))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_'); }
function b64d(s) { s=s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4)s+='='; return Uint8Array.from(atob(s),c=>c.charCodeAt(0)); }

async function signJWT(payload, secret, exp='15m') {
  const enc=new TextEncoder(), key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const now=Math.floor(Date.now()/1000); let e=now+900;
  if(exp.endsWith('m'))e=now+parseInt(exp)*60; else if(exp.endsWith('h'))e=now+parseInt(exp)*3600; else if(exp.endsWith('d'))e=now+parseInt(exp)*86400;
  const h=b64e(enc.encode(JSON.stringify({alg:'HS256',typ:'JWT'}))),c=b64e(enc.encode(JSON.stringify({...payload,iat:now,exp:e})));
  return `${h}.${c}.${b64e(await crypto.subtle.sign('HMAC',key,enc.encode(`${h}.${c}`)))}`;
}

async function verifyJWT(token, secret) {
  try{const p=token.split('.'); if(p.length!==3)return null;
  const enc=new TextEncoder(),key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  if(!await crypto.subtle.verify('HMAC',key,b64d(p[2]),enc.encode(`${p[0]}.${p[1]}`)))return null;
  const pl=JSON.parse(new TextDecoder().decode(b64d(p[1])));
  return (pl.exp&&pl.exp<Math.floor(Date.now()/1000))?null:pl;
  }catch{return null;}
}

function bearer(req){ const a=req.headers.get('Authorization')||''; const m=/^Bearer\s+(.+)$/i.exec(a); return m?m[1]:null; }

// ═══════════════ Response ═══════════════
function json(d,s=200){ return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PUT,PATCH,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization'}}); }

// ═══════════════ D1 DB helpers ═══════════════
function db(env){const run=async(sql,params=[])=>{const r=env.DB?await env.DB.prepare(sql).bind(...params).run():null;return r;};
const all=async(sql,params=[])=>{if(!env.DB)return{results:[]};const r=await env.DB.prepare(sql).bind(...params).all();return r;};
const first=async(sql,params=[])=>{if(!env.DB)return null;return await env.DB.prepare(sql).bind(...params).first();};
return{run,all,first};}

// ═══════════════ Auth Handlers ═══════════════

async function handleRegister(req,env){
  try{const b=await req.text();const{email,username,password,displayName}=JSON.parse(b);
  if(!email||!username||!password)return json({error:'Missing fields'},400);
  const d=db(env);const ex=await d.first('SELECT id FROM users WHERE email=? OR username=?',email.toLowerCase(),username);
  if(ex)return json({error:ex.email===email.toLowerCase()?'Email registered':'Username taken'},409);
  const enc=new TextEncoder(),salt=crypto.getRandomValues(new Uint8Array(16));
  const km=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
  const dk=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},km,256);
  const hash=`${b64e(salt)}:${b64e(dk)}`,now=new Date().toISOString();
  const admins=['siyam01751@gmail.com','admin@cineworld.com'];
  const role=admins.includes(email.toLowerCase())?'superadmin':'user';
  const r=await d.run('INSERT INTO users(email,username,passwordHash,displayName,role,isActive,createdAt,updatedAt) VALUES(?,?,?,?,?,1,?,?)',email.toLowerCase(),username,hash,displayName||username,role,now,now);
  const uid=r?r.meta?.last_row_id:0;
  const accessToken=await signJWT({userId:uid,role},env.JWT_ACCESS_SECRET,'15m');
  const refreshToken=await signJWT({userId:uid,family:crypto.randomUUID()},env.JWT_REFRESH_SECRET,'7d');
  await d.run('INSERT INTO refresh_tokens(userId,token,family,expiresAt,createdAt) VALUES(?,?,?,?,?)',uid,refreshToken,crypto.randomUUID(),new Date(Date.now()+7*86400000).toISOString(),now);
  return json({accessToken,refreshToken,user:{id:uid,email:email.toLowerCase(),username,displayName:displayName||username,role}},201);
  }catch(e){return json({error:e.message},500);}
}

async function handleLogin(req,env){
  try{const b=await req.text();const{email,password}=JSON.parse(b);
  if(!email||!password)return json({error:'Email and password required'},400);
  const d=db(env);const user=await d.first('SELECT * FROM users WHERE email=?',email.toLowerCase());
  if(!user||!user.isActive)return json({error:'Invalid credentials'},401);
  if(user.isBanned&&(!user.bannedUntil||new Date(user.bannedUntil)>new Date()))return json({error:'Account banned'},403);
  const parts=(user.passwordHash||':').split(':'); if(parts.length<2)return json({error:'Invalid credentials'},401);
  const enc=new TextEncoder(),salt=b64d(parts[0]);
  const km=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
  const dk=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},km,256);
  if(b64e(dk)!==parts[1])return json({error:'Invalid credentials'},401);
  const now=new Date().toISOString();
  await d.run('UPDATE users SET lastLoginAt=? WHERE id=?',now,user.id);
  const accessToken=await signJWT({userId:user.id,role:user.role},env.JWT_ACCESS_SECRET,'15m');
  const refreshToken=await signJWT({userId:user.id,family:crypto.randomUUID()},env.JWT_REFRESH_SECRET,'7d');
  await d.run('INSERT INTO refresh_tokens(userId,token,family,expiresAt,createdAt) VALUES(?,?,?,?,?)',user.id,refreshToken,crypto.randomUUID(),new Date(Date.now()+7*86400000).toISOString(),now);
  delete user.passwordHash; delete user.totpSecret;
  return json({accessToken,refreshToken,user});
  }catch(e){return json({error:e.message},500);}
}

async function handleMe(req,env){
  const tok=bearer(req); if(!tok)return json({error:'No token'},401);
  const pl=await verifyJWT(tok,env.JWT_ACCESS_SECRET); if(!pl)return json({error:'Invalid/expired token'},401);
  const u=await db(env).first('SELECT * FROM users WHERE id=?',pl.userId);
  if(!u)return json({error:'User not found'},404);
  delete u.passwordHash; delete u.totpSecret;
  return json({user:u});
}

// ═══════════════ Movie Handlers ═══════════════

async function handleGetMovies(req, env) {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const region = url.searchParams.get('region') || '';
  const search = url.searchParams.get('search') || '';
  const d = db(env);
  let sql = 'SELECT * FROM movies WHERE 1=1'; const params = [];
  if (region) { sql += ' AND region=?'; params.push(region); }
  if (search) { sql += ' AND (title LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  sql += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?'; params.push(limit, (page - 1) * limit);
  const movies = await d.all(sql, params);
  const count = await d.first('SELECT COUNT(*) as total FROM movies');
  return json({ movies: movies.results || [], total: count?.total || 0, page, limit });
}

async function handleGetMovie(req, env, id) {
  const movie = await db(env).first('SELECT * FROM movies WHERE id=? OR slug=?', id, id);
  if (!movie) return json({ error: 'Movie not found' }, 404);
  return json({ movie });
}

async function handleCreateMovie(req, env) {
  const tok = bearer(req); if (!tok) return json({ error: 'No token' }, 401);
  const pl = await verifyJWT(tok, env.JWT_ACCESS_SECRET);
  if (!pl || pl.role !== 'superadmin') return json({ error: 'Unauthorized' }, 403);
  const b = await req.text(); const { title, slug, description, thumbnail, videoUrl, duration, region, category } = JSON.parse(b);
  if (!title) return json({ error: 'Title required' }, 400);
  const now = new Date().toISOString();
  const d = db(env);
  await d.run('INSERT INTO movies(title,slug,description,thumbnail,videoUrl,duration,region,category,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?,?,?,?)',
    title, slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80), description || '', thumbnail || '', videoUrl || '', duration || 0, region || 'hollywood', category || '', now, now);
  return json({ success: true }, 201);
}

async function handleUpdateMovie(req, env, id) {
  const tok = bearer(req); if (!tok) return json({ error: 'No token' }, 401);
  const pl = await verifyJWT(tok, env.JWT_ACCESS_SECRET);
  if (!pl || pl.role !== 'superadmin') return json({ error: 'Unauthorized' }, 403);
  const b = await req.text(); const data = JSON.parse(b);
  const d = db(env), now = new Date().toISOString();
  const sets = []; const params = [];
  for (const [k, v] of Object.entries(data)) {
    if (['title', 'slug', 'description', 'thumbnail', 'videoUrl', 'duration', 'region', 'category'].includes(k)) {
      sets.push(`${k}=?`); params.push(v);
    }
  }
  if (!sets.length) return json({ error: 'No fields to update' }, 400);
  sets.push('updatedAt=?'); params.push(now); params.push(id);
  await d.run(`UPDATE movies SET ${sets.join(',')} WHERE id=?`, ...params);
  return json({ success: true });
}

async function handleDeleteMovie(req, env, id) {
  const tok = bearer(req); if (!tok) return json({ error: 'No token' }, 401);
  const pl = await verifyJWT(tok, env.JWT_ACCESS_SECRET);
  if (!pl || pl.role !== 'superadmin') return json({ error: 'Unauthorized' }, 403);
  await db(env).run('DELETE FROM movies WHERE id=?', id);
  return json({ success: true });
}

// ═══════════════ Admin Handlers ═══════════════

async function handleAdminDashboard(req, env) {
  const tok = bearer(req); if (!tok) return json({ error: 'No token' }, 401);
  const pl = await verifyJWT(tok, env.JWT_ACCESS_SECRET);
  if (!pl || pl.role !== 'superadmin') return json({ error: 'Unauthorized' }, 403);
  const d = db(env);
  const [users, movies, cats] = await Promise.all([
    d.first('SELECT COUNT(*) as total FROM users'),
    d.first('SELECT COUNT(*) as total FROM movies'),
    d.first('SELECT COUNT(*) as total FROM categories'),
  ]);
  return json({ users: users?.total || 0, movies: movies?.total || 0, categories: cats?.total || 0 });
}

async function handleAdminUsers(req, env) {
  const tok = bearer(req); if (!tok) return json({ error: 'No token' }, 401);
  const pl = await verifyJWT(tok, env.JWT_ACCESS_SECRET);
  if (!pl || pl.role !== 'superadmin') return json({ error: 'Unauthorized' }, 403);
  const users = await db(env).all('SELECT id,email,username,displayName,role,isActive,isBanned,createdAt,lastLoginAt FROM users ORDER BY createdAt DESC');
  return json({ users: users.results || [] });
}

// ═══════════════ Stripe Payments ═══════════════

async function stripeFetch(endpoint, apiKey, body) {
  const res = await fetch(`https://api.stripe.com/v1${endpoint}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  });
  return res.json();
}

async function handleCreateCheckout(req, env) {
  const tok = bearer(req); if (!tok) return json({ error: 'No token' }, 401);
  const pl = await verifyJWT(tok, env.JWT_ACCESS_SECRET);
  if (!pl) return json({ error: 'Invalid token' }, 401);

  const body = await req.json();
  const plan = body.plan || 'premium_monthly';
  const priceIds = {
    'premium_monthly': env.STRIPE_PREMIUM_MONTHLY || 'price_monthly',
    'premium_yearly': env.STRIPE_PREMIUM_YEARLY || 'price_yearly',
  };
  const priceId = priceIds[plan] || priceIds['premium_monthly'];

  const origin = new URL(req.url).origin;
  const session = await stripeFetch('/checkout/sessions', env.STRIPE_SECRET_KEY, {
    'payment_method_types[]': 'card',
    'mode': 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    'success_url': `${origin}/premium?success=true`,
    'cancel_url': `${origin}/premium?cancelled=true`,
    'client_reference_id': String(pl.userId),
    'metadata[userId]': String(pl.userId),
  });

  if (session.error) return json({ error: session.error.message || 'Stripe error' }, 500);
  return json({ url: session.url });
}

async function handleStripeWebhook(req, env) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) return json({ error: 'No signature' }, 400);

  const body = await req.text();
  // In production, verify webhook signature using STRIPE_WEBHOOK_SECRET
  // For now, parse the event directly
  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return json({ error: 'Invalid body' }, 400);
  }

  const d = db(env);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = parseInt(session.client_reference_id || session.metadata?.userId);
      if (!userId) break;

      await d.run(
        'INSERT INTO payments(userId, stripeSessionId, amount, currency, status, plan, createdAt) VALUES(?,?,?,?,?,?,?)',
        userId, session.id, (session.amount_total || 0) / 100, session.currency || 'usd', 'completed',
        session.metadata?.plan || 'premium', new Date().toISOString()
      );

      // Upgrade user role to premium
      await d.run('UPDATE users SET role=? WHERE id=? AND role=?', 'premium', userId, 'user');
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const userId = parseInt(subscription.metadata?.userId || '0');
      if (userId) {
        await d.run('UPDATE users SET role=? WHERE id=? AND role=?', 'user', userId, 'premium');
      }
      break;
    }
  }

  return json({ received: true });
}

// ═══════════════ Categories ═══════════════

async function handleGetCategories(req, env) {
  const cats = await db(env).all('SELECT * FROM categories ORDER BY name');
  return json({ categories: cats.results || [] });
}

// ═══════════════ Main Router ═══════════════

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname; const m = request.method;

    // Health
    if (p === '/api/health') return json({ status: 'ok', timestamp: new Date().toISOString(), env: 'cloudflare-pages-worker', version: '4.0.0' });

    // CORS preflight
    if (m === 'OPTIONS') return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization', 'Access-Control-Max-Age': '86400' } });

    // ── Auth ──
    if (p === '/api/auth/register' && m === 'POST') return handleRegister(request, env);
    if (p === '/api/auth/login' && m === 'POST') return handleLogin(request, env);
    if (p === '/api/auth/me' && m === 'GET') return handleMe(request, env);

    // ── Movies ──
    if (p === '/api/movies' && m === 'GET') return handleGetMovies(request, env);
    if (p === '/api/movies' && m === 'POST') return handleCreateMovie(request, env);
    const movieMatch = p.match(/^\/api\/movies\/(.+)$/);
    if (movieMatch) {
      const id = movieMatch[1];
      if (m === 'GET') return handleGetMovie(request, env, id);
      if (m === 'PATCH') return handleUpdateMovie(request, env, id);
      if (m === 'DELETE') return handleDeleteMovie(request, env, id);
    }

    // ── Categories ──
    if (p === '/api/categories' && m === 'GET') return handleGetCategories(request, env);

    // ── Stripe ──
    if (p === '/api/stripe/create-checkout' && m === 'POST') return handleCreateCheckout(request, env);
    if (p === '/api/stripe/webhook' && m === 'POST') return handleStripeWebhook(request, env);

    // ── Admin ──
    if (p === '/api/admin/dashboard' && m === 'GET') return handleAdminDashboard(request, env);
    if (p === '/api/admin/users' && m === 'GET') return handleAdminUsers(request, env);

    // ── Static assets ──
    try {
      const response = await env.ASSETS.fetch(request.clone());
      const ct = response.headers.get('Content-Type') || '';
      const isHtml = ct.includes('text/html') || p === '/' || p.endsWith('.html');
      if (isHtml) {
        const mod = new Response(response.body, response);
        mod.headers.set('X-Frame-Options', 'SAMEORIGIN');
        mod.headers.set('X-Content-Type-Options', 'nosniff');
        mod.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        mod.headers.set('Permissions-Policy', 'accelerometer=(),autoplay=(self),camera=(),encrypted-media=(self),fullscreen=(self),geolocation=(),gyroscope=(),microphone=(),midi=(),payment=(),picture-in-picture=(self),usb=()');
        mod.headers.set('Content-Security-Policy', "default-src 'self';script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com;style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;img-src 'self' data: blob: https: http:;font-src 'self' https://fonts.gstatic.com;frame-src 'self' https://www.youtube.com https://youtube.com https://*.youtube.com;connect-src 'self' https://*.cineworldclips.onrender.com https://*.r2.cloudflarestorage.com https://accounts.google.com https://*.googleapis.com;media-src 'self' blob: https: http:;worker-src 'self' blob:;child-src 'self' https://www.youtube.com");
        return mod;
      }
      return response;
    } catch (e) {
      // No static file found — return 404 JSON for API paths, HTML for pages
      if (p.startsWith('/api/')) return json({ error: 'Not found' }, 404);
      return new Response('Not found', { status: 404 });
    }
  }
};
