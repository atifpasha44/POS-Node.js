const API = 'http://localhost:3001/api/reason-codes';

(async () => {
  try {
    console.log('1) Create reason code');
    const createResp = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason_code: 'IT_TEST',
        reason_description: 'Integration test reason',
        operation_type: 'System',
        display_sequence: 99,
        is_active: 1
      })
    });
    const createJson = await createResp.json();
    console.log('Create response:', createJson);

    console.log('\n2) Read all reason codes');
    const readResp = await fetch(API);
    const readJson = await readResp.json();
    console.log('Read response count:', Array.isArray(readJson.data) ? readJson.data.length : 'N/A');

    console.log('\n3) Update reason code');
    const updateResp = await fetch(API + '/' + encodeURIComponent('IT_TEST'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason_description: 'Updated by integration test',
        operation_type: 'System',
        display_sequence: 100,
        is_active: 1
      })
    });
    const updateJson = await updateResp.json();
    console.log('Update response:', updateJson);

    console.log('\n4) Delete reason code');
    const deleteResp = await fetch(API + '/' + encodeURIComponent('IT_TEST'), { method: 'DELETE' });
    const deleteJson = await deleteResp.json();
    console.log('Delete response:', deleteJson);

    console.log('\nIntegration test completed');
  } catch (err) {
    console.error('Integration test failed:', err);
    process.exit(1);
  }
})();
