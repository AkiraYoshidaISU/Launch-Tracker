import { writeFile } from "node:fs/promises";

const API_CANDIDATES = [
  "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=30&hide_recent_previous=true",
  "https://ll.thespacedevs.com/2.3.0/launches/upcoming/?limit=30&hide_recent_previous=true"
];

async function fetchFromCandidates() {
  let lastError = null;

  for (const url of API_CANDIDATES) {
    try {
      const response = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "launch-dashboard-github-action"
        }
      });

      if (!response.ok) {
        throw new Error(`Failed ${url}: HTTP ${response.status}`);
      }

      const payload = await response.json();
      const results = Array.isArray(payload.results) ? payload.results : [];
      if (results.length === 0) {
        throw new Error(`No results in payload from ${url}`);
      }

      return { url, results };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("No API candidate succeeded");
}

function sanitizeLaunch(item) {
  return {
    id: item.id ?? null,
    name: item.name ?? null,
    net: item.net ?? null,
    mission: item.mission ? { name: item.mission.name ?? null } : null,
    rocket: item.rocket
      ? {
          configuration: {
            full_name: item.rocket.configuration?.full_name ?? null,
            name: item.rocket.configuration?.name ?? null
          }
        }
      : null,
    pad: item.pad
      ? {
          name: item.pad.name ?? null,
          location: {
            name: item.pad.location?.name ?? null,
            country_code: item.pad.location?.country_code ?? null
          }
        }
      : null
  };
}

async function main() {
  const { url, results } = await fetchFromCandidates();

  const sanitized = results
    .filter((item) => item?.net)
    .map(sanitizeLaunch)
    .sort((a, b) => new Date(a.net).getTime() - new Date(b.net).getTime());

  const output = {
    generated_at: new Date().toISOString(),
    source: url,
    result_count: sanitized.length,
    results: sanitized
  };

  const json = `${JSON.stringify(output, null, 2)}\n`;
  await writeFile("data/upcoming-launches.json", json, "utf8");
  console.log(`Saved ${sanitized.length} launches from ${url}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
