async function main() {
  const BUCKET0_BASE_URL = 'https://bucket0.com/api/agent-bucket';
  const apiKey = 'b0ak_LWKhcOeKEW9KKSXDG432XqEjYIgVGxP02qQfl32L';
  
  // Upload
  const form = new FormData();
  form.append('file', new Blob([Buffer.from('hello world')]), 'hello.txt');
  form.append('filename', 'test-delete/hello.txt');
  
  console.log("Uploading...");
  let res = await fetch(`${BUCKET0_BASE_URL}/files/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form
  });
  let data = await res.json();
  console.log("Upload:", data);
  
  if (!data.key) return;
  
  // Delete by path
  console.log("Deleting by path...", data.key);
  res = await fetch(`${BUCKET0_BASE_URL}/files/${encodeURIComponent(data.key)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  console.log("Delete by path /files/key:", res.status, await res.text());

  // Try the other URL
  console.log("Deleting by query...", data.key);
  res = await fetch(`${BUCKET0_BASE_URL}/files?key=${encodeURIComponent(data.key)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  console.log("Delete by query:", res.status, await res.text());
}
main();
