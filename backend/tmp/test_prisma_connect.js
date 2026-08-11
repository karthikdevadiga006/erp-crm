require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

async function main(){
  const p = new PrismaClient({ log: ['info','warn','error'] });
  try{
    await p.$connect();
    console.log('connected');
  }catch(e){
    console.error('CONN ERROR:', e);
  }finally{
    await p.$disconnect();
  }
}

main();
