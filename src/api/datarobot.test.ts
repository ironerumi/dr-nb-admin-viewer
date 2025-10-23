import { describe, test, expect, beforeAll } from "bun:test";
import { fetchDatasets } from "./datarobot";

describe("DataRobot API Connectivity", () => {
  let apiToken: string;
  let apiEndpoint: string;

  beforeAll(() => {
    apiToken = process.env.DATAROBOT_API_TOKEN ?? "";
    if (!apiToken) {
      throw new Error("DATAROBOT_API_TOKEN not found in environment variables");
    }

    apiEndpoint = process.env.DATAROBOT_ENDPOINT ?? "";
    if (!apiEndpoint) {
      throw new Error("DATAROBOT_ENDPOINT not found in environment variables");
    }
  });

  test("should successfully connect to DataRobot datasets API", async () => {
    const response = await fetchDatasets(apiToken);
    
    expect(response).toBeDefined();
    expect(response.totalCount).toBeGreaterThan(0);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBeGreaterThan(0);
  }, 10000);

  test("should return valid dataset structure", async () => {
    const response = await fetchDatasets(apiToken);
    
    const firstDataset = response.data[0];
    expect(firstDataset).toBeDefined();
    if (!firstDataset) return;
    
    expect(firstDataset.datasetId).toBeDefined();
    expect(typeof firstDataset.datasetId).toBe("string");
    expect(firstDataset.name).toBeDefined();
    expect(typeof firstDataset.name).toBe("string");
    expect(typeof firstDataset.isLatestVersion).toBe("boolean");
    expect(Array.isArray(firstDataset.categories)).toBe(true);
    expect(typeof firstDataset.rowCount).toBe("number");
    expect(typeof firstDataset.columnCount).toBe("number");
  }, 15000);

  test("should handle pagination metadata", async () => {
    const response = await fetchDatasets(apiToken);
    
    expect(response.count).toBeDefined();
    expect(typeof response.count).toBe("number");
    expect(response.totalCount).toBeDefined();
    expect(typeof response.totalCount).toBe("number");
    expect(response.previous === null || typeof response.previous === "string").toBe(true);
    expect(response.next === null || typeof response.next === "string").toBe(true);
  }, 10000);

  test("should throw error with invalid token", async () => {
    expect(async () => {
      await fetchDatasets("invalid-token");
    }).toThrow();
  });
});
