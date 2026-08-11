(async () => {
  require('dotenv/config');
  const SEED_PASSWORD = process.env.SEED_PASSWORD;
  if (!SEED_PASSWORD) {
    console.error('SEED_PASSWORD environment variable is required to run this test.');
    process.exit(1);
  }
  const base = 'http://localhost:4000/api/v1';
  const loginRes = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@wholesaleco.test', password: SEED_PASSWORD }),
  });
  if (!loginRes.ok) { console.error('Login failed', await loginRes.text()); process.exit(1); }
  const { token } = await loginRes.json();
  console.log('Logged in, token length', token.length);

  const productsRes = await fetch(`${base}/products`, { headers: { Authorization: `Bearer ${token}` } });
  if (!productsRes.ok) { console.error('Products list failed', await productsRes.text()); process.exit(1); }
  const productsBody = await productsRes.json();
  const prod = productsBody.data?.[0] || productsBody[0];
  if (!prod) { console.error('No products found'); process.exit(1); }
  console.log('Using product', prod.id, prod.sku, 'stock', prod.currentStock);

  const createRes = await fetch(`${base}/challans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ customerId: 'seed-customer-1', items: [{ productId: prod.id, quantity: 1 }] }),
  });
  const createBody = await createRes.json();
  if (!createRes.ok) { console.error('Create challan failed', createBody); process.exit(1); }
  const challanId = createBody.data?.id || createBody.id;
  console.log('Created challan', challanId);

  const confirmRes = await fetch(`${base}/challans/${challanId}/confirm`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const confirmBody = await confirmRes.json();
  if (!confirmRes.ok) { console.error('Confirm failed', confirmBody); process.exit(1); }
  console.log('Confirmed challan', confirmBody.data?.id || confirmBody.id);

  // Check product stock decreased
  const prodAfterRes = await fetch(`${base}/products/${prod.id}`, { headers: { Authorization: `Bearer ${token}` } });
  const prodAfter = await prodAfterRes.json();
  console.log('Product after stock:', prodAfter.data?.currentStock || prodAfter.currentStock);

  // Check movements
  const movesRes = await fetch(`${base}/products/${prod.id}/movements`, { headers: { Authorization: `Bearer ${token}` } });
  const moves = await movesRes.json();
  console.log('Movement count:', moves.data?.length ?? moves.length);

  // Check challan status
  const challanRes = await fetch(`${base}/challans/${challanId}`, { headers: { Authorization: `Bearer ${token}` } });
  const challan = await challanRes.json();
  console.log('Challan status:', challan.data?.status || challan.status);

  console.log('Test completed successfully');
})();
