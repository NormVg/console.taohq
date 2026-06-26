async function main() {
  const BUCKET0_BASE_URL = 'https://bucket0.com/api/agent-bucket';
  const apiKey = 'b0ak_LWKhcOeKEW9KKSXDG432XqEjYIgVGxP02qQfl32L';
  const key = 'test-delete/hello.txt';
  
  // Download
  let res = await fetch(`${BUCKET0_BASE_URL}/files/download?key=${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  console.log("Download:", res.status, res.headers.get('content-type'));
  
  if (res.ok) {
    const text = await res.text();
    console.log("Content:", text);
  } else {
    console.log("Error:", await res.text());
  }
}
main();
