/**
 * test_dpcc_parser.mjs
 */

async function fetchDPCCStation(stCode, stName) {
  const url = `http://dpccairdata.com/dpccairdata/display/AallStationView5MinData.php?stName=${stCode}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  // Helper to extract concentration from a table row by parameter name
  const extractPollutant = (paramName) => {
    // Find table row containing parameter
    const rowRegex = new RegExp(`<td>\\s*${paramName}[\\s\\S]*?<\\/tr>`, "i");
    const rowMatch = html.match(rowRegex);
    if (!rowMatch) return null;
    const rowHtml = rowMatch[0];

    // Find all <td align="center"> in that row
    // Format is: [0]: Date, [1]: Time, [2]: Concentration, [3]: Prescribed Standard
    const cells = [...rowHtml.matchAll(/<td[^>]*align=["']?center["']?[^>]*>([\s\S]*?)<\/td>/gi)];
    if (cells.length >= 3) {
      const rawVal = cells[2][1].replace(/<[^>]+>/g, "").trim();
      const num = parseFloat(rawVal);
      return isNaN(num) ? null : num;
    }
    return null;
  };

  const nh3 = extractPollutant("Ammonia");
  const co = extractPollutant("Carbon Monoxide");
  const no2 = extractPollutant("Nitrogen Dioxide");
  const o3 = extractPollutant("Ozone");
  const so2 = extractPollutant("Sulphur Dioxide");
  const pm10 = extractPollutant("Particulate Matter\\s*<\\s*10");
  const pm25 = extractPollutant("Particulate Matter\\s*<\\s*2\\.5");

  // Date and Time (IST)
  let timeStr = new Date().toISOString();
  const timeMatch = html.match(/Date<\/span>\s*:\s*([^&]+)&nbsp;&nbsp;<span class="msg1">Time \(IST\)<\/span>\s*:\s*([^&<]+)/i);
  if (timeMatch) {
    timeStr = `${timeMatch[1].trim()} ${timeMatch[2].trim()} IST`;
  }

  return {
    name: stName,
    time: timeStr,
    pm25,
    pm10,
    no2,
    so2,
    co,
    o3,
    nh3,
  };
}

async function run() {
  console.log("Fetching live DPCC stations...");
  const stations = [
    { code: "QW5hbmRWaWhhcg==", name: "Anand Vihar" },
    { code: "TWFuZGlybWFyZw==", name: "Mandir Marg" },
    { code: "UHVuamFiaUJhZ2g=", name: "Punjabi Bagh" },
    { code: "UktQdXJhbQ==", name: "R.K. Puram" },
  ];

  for (const s of stations) {
    try {
      const data = await fetchDPCCStation(s.code, s.name);
      console.log(`\nStation: ${data.name} | Updated: ${data.time}`);
      console.log(`  PM2.5: ${data.pm25} µg/m³ | PM10: ${data.pm10} µg/m³`);
      console.log(`  NO2: ${data.no2} | SO2: ${data.so2} | CO: ${data.co} | O3: ${data.o3} | NH3: ${data.nh3}`);
    } catch (e) {
      console.error(`Failed ${s.name}:`, e.message);
    }
  }
}

run();
