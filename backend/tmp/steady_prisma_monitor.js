require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

async function main(){
  const p = new PrismaClient({ log: ['info','warn','error'] });
  try{
    await p.$connect();
    console.log('connected, running queries...');
    for(let i=1;i<=120;i++){
      try{
        const users = await p.user.findMany({ take: 1 });
        console.log(`${i}\tOK`);
      }catch(e){
        console.error(`${i}\tERR`, e && e.message ? e.message : e);
        if(e.stack) console.error(e.stack);
      }
      await new Promise(r=>setTimeout(r,1000));
    }
  }catch(e){
    console.error('connect failed', e);
  }finally{
    await p.$disconnect();
    console.log('done');
  }
}

main();
