async function main() {
  const BUCKET0_BASE_URL = 'https://bucket0.com/api/agent-bucket';
  const apiKey = 'b0ak_LWKhcOeKEW9KKSXDG432XqEjYIgVGxP02qQfl32L';
  const key = 'test-delete/hello.txt';
  
  console.log("Deleting by /files/delete...");
  const res = await fetch(`${BUCKET0_BASE_URL}/files/delete?key=${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  console.log("Delete by /files/delete:", res.status, await res.text());
}
main();
