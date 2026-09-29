/**
 * test_combined_live.mjs
 */

const NCR_COORDS = [
  { id: "noida_01", name: "Sector 62, Noida", city: "Noida", lat: 28.6245, lon: 77.3649 },
  { id: "ggn_01", name: "Vikas Sadan, Sector 11", city: "Gurugram", lat: 28.4595, lon: 77.0266 },
  { id: "fbd_01", name: "Sector 16A", city: "Faridabad", lat: 28.4111, lon: 77.3178 },
  { id: "gzb_01", name: "Vasundhara", city: "Ghaziabad", lat: 28.6603, lon: 77.3573 },
  { id: "snp_01", name: "Murthal Road", city: "Sonipat", lat: 28.9931, lon: 77.0151 },
];

async function run() {
  const lats = NCR_COORDS.map(s => s.lat).join(",");
  const lons = NCR_COORDS.map(s => s.lon).join(",");
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lons}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`;
  
  console.log("Fetching live NCR from Open-Meteo...");
  const res = await fetch(url);
  const data = await res.json();
  const arr = Array.isArray(data) ? data : [data];
  
  arr.forEach((item, idx) => {
    const st = NCR_COORDS[idx];
    const c = item.current;
    console.log(`Station: ${st.name} in ${st.city} (Time: ${c.time})`);
    console.log(`  PM2.5: ${c.pm2_5} | PM10: ${c.pm10} | CO: ${(c.carbon_monoxide/1000).toFixed(2)} mg/m³ | NO2: ${c.nitrogen_dioxide} | SO2: ${c.sulphur_dioxide} | O3: ${c.ozone}`);
  });
}

run();
