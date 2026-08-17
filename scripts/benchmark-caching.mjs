async function runBenchmarks() {
  const BASE_URL = 'http://localhost:3001';

  console.log('====================================================');
  console.log('🚀 TESTING /api/properties PERFORMANCE & CACHING');
  console.log('====================================================\n');

  async function measure(url, label) {
    const t0 = performance.now();
    const res = await fetch(url);
    const dur = (performance.now() - t0).toFixed(2);
    const data = await res.json();
    const cacheHeader = res.headers.get('x-cache-status') || 'N/A';
    const serverTiming = res.headers.get('server-timing') || 'N/A';
    const count = data?.data?.length ?? 0;
    
    console.log(`[${label}]`);
    console.log(`  URL: ${url}`);
    console.log(`  Status: ${res.status} | Cache Header: ${cacheHeader}`);
    console.log(`  Properties Returned: ${count}`);
    console.log(`  Server-Timing: ${serverTiming}`);
    console.log(`  Roundtrip Duration: ${dur} ms\n`);
    return { dur: Number(dur), cacheHeader, count };
  }

  // 1. Initial Request (Cold/Miss)
  console.log('--- TEST 1: Default Listing Initial Fetch ---');
  await measure(`${BASE_URL}/api/properties`, 'Initial GET (Cache MISS)');

  // 2. Second Request (Warm/Hit)
  console.log('--- TEST 2: Repeated Listing Fetch ---');
  await measure(`${BASE_URL}/api/properties`, 'Repeated GET (Cache HIT)');

  // 3. Filtered Query 1: city=Mohali
  console.log('--- TEST 3: Filter Query (city=Mohali) ---');
  await measure(`${BASE_URL}/api/properties?city=Mohali`, 'city=Mohali (Cache MISS)');
  await measure(`${BASE_URL}/api/properties?city=Mohali`, 'city=Mohali (Cache HIT)');

  // 4. Distinct Filter Query 2: city=Chandigarh (Must NOT collide with Mohali)
  console.log('--- TEST 4: Distinct Filter (city=Chandigarh) ---');
  await measure(`${BASE_URL}/api/properties?city=Chandigarh`, 'city=Chandigarh (Cache MISS)');
  await measure(`${BASE_URL}/api/properties?city=Chandigarh`, 'city=Chandigarh (Cache HIT)');

  // 5. Price Filter Isolation
  console.log('--- TEST 5: Price Filter Isolation ---');
  await measure(`${BASE_URL}/api/properties?maxPrice=50000`, 'maxPrice=50000 (Cache MISS)');
  await measure(`${BASE_URL}/api/properties?maxPrice=50000`, 'maxPrice=50000 (Cache HIT)');
  await measure(`${BASE_URL}/api/properties?maxPrice=100000`, 'maxPrice=100000 (Distinct Cache MISS)');

  console.log('====================================================');
  console.log('✅ ALL PERFORMANCE BENCHMARKS COMPLETE');
  console.log('====================================================');
}

runBenchmarks().catch(console.error);
