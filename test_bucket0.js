async function main() {
  const BUCKET0_BASE_URL = 'https://bucket0.com/api/agent-bucket';
  const apiKey = 'b0ak_LWKhcOeKEW9KKSXDG432XqEjYIgVGxP02qQfl32L';
  const key = 'asd/loka/IMG_20220626_214227-01.jpeg';
  const res = await fetch(`${BUCKET0_BASE_URL}/files?key=${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text);
}
main();
