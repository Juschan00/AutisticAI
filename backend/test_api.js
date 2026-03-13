async function testBackend() {
  try {
    console.log("Fetching locations from http://localhost:3000/locations...");
    const response = await fetch("http://localhost:3000/locations");
    console.log(`Backend status: ${response.status}`);
    const data = await response.json();
    console.log(`Number of locations returned: ${data.length}`);
    if (data.length > 0) {
      console.log("First location:", JSON.stringify(data[0], null, 2));
    }
  } catch (err) {
    console.error(`Fetch failed: ${err.message}`);
  }
}

testBackend();
