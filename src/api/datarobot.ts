export interface DatasetResponse {
  count: number;
  next: string | null;
  previous: string | null;
  data: Dataset[];
  totalCount: number;
}

export interface Dataset {
  datasetId: string;
  name: string;
  isLatestVersion: boolean;
  versionId: string;
  categories: string[];
  creationDate: string;
  createdBy: string | null;
  isSnapshot: boolean;
  dataPersisted: boolean | null;
  isDataEngineEligible: boolean;
  processingState: string;
  timeSeriesProperties: {
    isMostlyImputed: boolean | null;
  };
  rowCount: number;
  columnCount: number;
  datasetSize: number;
  sampleSize: {
    value: number;
    type: string;
  } | null;
}

export async function getDatasets(apiToken: string): Promise<DatasetResponse> {
  const response = await fetch("https://app.datarobot.com/api/v2/datasets/", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} - ${response.statusText}`);
  }

  return await response.json() as DatasetResponse;
}
