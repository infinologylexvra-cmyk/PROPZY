import mongoose from 'mongoose';

const directUri = 'mongodb://letsrentz_admin:Infinologylexvra@ac-29l4zhq-shard-00-00.saq1nen.mongodb.net:27017,ac-29l4zhq-shard-00-01.saq1nen.mongodb.net:27017,ac-29l4zhq-shard-00-02.saq1nen.mongodb.net:27017/letsrentz?ssl=true&replicaSet=atlas-dw2hzl-shard-0&authSource=admin&retryWrites=true&w=majority';

async function testDirect() {
  const t0 = performance.now();
  console.log('Testing direct replica set connection without +srv...');
  try {
    await mongoose.connect(directUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    console.log(`✅ Direct connection succeeded in ${(performance.now() - t0).toFixed(2)}ms! (ZERO SRV LOOKUPS)`);
    const count = await mongoose.connection.db.collection('properties').countDocuments();
    console.log(`Found ${count} property documents in MongoDB Atlas.`);
    const sample = await mongoose.connection.db.collection('properties').findOne({});
    console.log(`Sample PID: ${sample?.pid}, Title: ${sample?.title}`);
  } catch (err) {
    console.error('❌ Connection error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

testDirect();
