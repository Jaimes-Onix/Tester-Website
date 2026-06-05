import { fileURLToPath } from 'node:url'; import { join } from 'node:path';
const ROOT=fileURLToPath(new URL('.',import.meta.url)); const DIR=join(ROOT,'temporary screenshots');
const puppeteer=(await import('puppeteer')).default;
const b=await puppeteer.launch({headless:'shell',args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
const p=await b.newPage(); await p.setViewport({width:1100,height:850,deviceScaleFactor:1.5});
await p.goto('http://localhost:3000/product.html',{waitUntil:'networkidle2',timeout:60000});
await new Promise(r=>setTimeout(r,800));
// scroll to demo section
await p.evaluate(()=>{const v=document.querySelector('.demo'); if(v)v.scrollIntoView({block:'center'});});
await new Promise(r=>setTimeout(r,500));
const el=await p.$('.demo'); if(el){await el.screenshot({path:join(DIR,'product-demo.png')}); console.log('demo shot');}
// also report video element readiness
const info=await p.evaluate(()=>{const v=document.querySelector('video'); return v?{src:v.currentSrc||v.src, w:v.videoWidth, h:v.videoHeight, dur:v.duration, err:v.error?v.error.code:null}:null;});
console.log('video:', JSON.stringify(info));
await b.close();
