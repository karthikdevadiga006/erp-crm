require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

async function attempt(i){
  const p = new PrismaClient();
  const start = new Date();
  try{
    await p.$connect();
    const end = new Date();
    console.log(`${i}	OK	${end.toISOString()} (${end-start}ms)`);
  }catch(e){
    console.error(`${i}	ERR	${new Date().toISOString()}`, e.message || e);
  }finally{
    try{ await p.$disconnect(); }catch(_){}
  }
}

(async ()=>{
  for(let i=1;i<=60;i++){
    await attempt(i);
    await new Promise(r=>setTimeout(r,500));
  }
  console.log('monitor done');
})();
