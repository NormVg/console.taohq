async function main() {
  const BUCKET0_BASE_URL = 'https://bucket0.com/api/agent-bucket';
  const apiKey = 'b0ak_LWKhcOeKEW9KKSXDG432XqEjYIgVGxP02qQfl32L';
  
  let res = await fetch(`${BUCKET0_BASE_URL}/files?page=1&pageSize=10`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  console.log("List:", res.status, await res.text());
}
main();
