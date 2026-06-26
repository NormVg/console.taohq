async function main() {
  const BUCKET0_BASE_URL = 'https://bucket0.com/api/agent-bucket';
  const apiKey = 'b0ak_LWKhcOeKEW9KKSXDG432XqEjYIgVGxP02qQfl32L';
  const key = 'test-delete/hello.txt';
  
  const res = await fetch(`${BUCKET0_BASE_URL}/files/delete`, {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ key })
  });
  console.log("Status:", res.status);
  console.log("Response:", await res.text());
}
main();
