async function main() {
  const BUCKET0_BASE_URL = 'https://bucket0.com/api/agent-bucket';
  const apiKey = 'b0ak_LWKhcOeKEW9KKSXDG432XqEjYIgVGxP02qQfl32L';
  
  // Upload
  const form = new FormData();
  form.append('file', new Blob([Buffer.from('hello world 2')]), 'hello2.txt');
  form.append('filename', 'test-delete/hello2.txt');
  
  let res = await fetch(`${BUCKET0_BASE_URL}/files/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form
  });
  let data = await res.json();
  console.log("Upload:", data);
  
  // Delete WITHOUT encodeURIComponent
  res = await fetch(`${BUCKET0_BASE_URL}/files?key=${data.key}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  console.log("Delete without encode:", res.status, await res.text());
}
main();
