async function main() {
  const url = 'http://localhost:3000/api/cdn/assets/' + encodeURIComponent('asd/loka/IMG_20220626_214227-01.jpeg');
  console.log("URL:", url);
  const res = await fetch(url, { method: 'DELETE' });
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text);
}
main();
