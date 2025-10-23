import { getDatasets } from "./src/api/datarobot";

const apiToken = process.env.DATAROBOT_API_TOKEN;

if (!apiToken) {
  console.error("Error: DATAROBOT_API_TOKEN not found in .env file");
  process.exit(1);
}

try {
  const data = await getDatasets(apiToken);
  console.log(JSON.stringify(data, null, 2));
} catch (error) {
  console.error("Error fetching datasets:", error);
  process.exit(1);
}