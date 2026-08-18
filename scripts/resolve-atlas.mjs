import dns from 'dns';
import { promisify } from 'util';

dns.setServers(['8.8.8.8', '1.1.1.1']);
const resolveSrv = promisify(dns.resolveSrv);
const resolveTxt = promisify(dns.resolveTxt);

async function inspectAtlas() {
  try {
    const srvRecords = await resolveSrv('_mongodb._tcp.cluster0.saq1nen.mongodb.net');
    console.log('SRV Records (Hosts):', srvRecords);

    const txtRecords = await resolveTxt('cluster0.saq1nen.mongodb.net');
    console.log('TXT Records (Options):', txtRecords);

    const hosts = srvRecords.map(r => `${r.name}:${r.port}`).join(',');
    const options = txtRecords.flat().join('&');

    console.log('\n--- Direct Connection URI without +srv ---');
    console.log(`Hosts: ${hosts}`);
    console.log(`Options: ${options}`);
  } catch (err) {
    console.error('Error resolving:', err);
  }
}

inspectAtlas();
