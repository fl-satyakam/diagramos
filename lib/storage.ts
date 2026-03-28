import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.DYNAMODB_TABLE || "diagramos-diagrams";
const REGION = process.env.AWS_REGION || "us-east-1";

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export interface StoredDiagram {
  id: string;
  name: string;
  mermaidCode: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  // Canvas state — positions, dimensions, edges, node styles
  nodes?: any[];
  edges?: any[];
  positions?: Record<string, { x: number; y: number; width?: number; height?: number }>;
}

export async function listDiagrams(): Promise<StoredDiagram[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      ProjectionExpression: "id, #n, updatedAt, createdAt, tags",
      ExpressionAttributeNames: { "#n": "name" },
    })
  );
  const items = (result.Items || []) as StoredDiagram[];
  return items.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
}

export async function getDiagram(id: string): Promise<StoredDiagram | null> {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { id } })
  );
  return (result.Item as StoredDiagram) || null;
}

export async function getDiagramByName(name: string): Promise<StoredDiagram | null> {
  // DynamoDB doesn't support case-insensitive queries natively
  // Scan with filter — fine for our scale (< 10k diagrams)
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "#n = :name",
      ExpressionAttributeNames: { "#n": "name" },
      ExpressionAttributeValues: { ":name": name },
    })
  );
  if (result.Items && result.Items.length > 0) {
    return result.Items[0] as StoredDiagram;
  }
  // Try case-insensitive
  const all = await listDiagrams();
  const lower = name.toLowerCase();
  const match = all.find((d) => d.name.toLowerCase() === lower);
  if (match) return getDiagram(match.id);
  return null;
}

export async function saveDiagram(diagram: StoredDiagram): Promise<StoredDiagram> {
  diagram.updatedAt = new Date().toISOString();
  if (!diagram.createdAt) {
    diagram.createdAt = diagram.updatedAt;
  }
  await docClient.send(
    new PutCommand({ TableName: TABLE_NAME, Item: diagram })
  );
  return diagram;
}

export async function deleteDiagram(id: string): Promise<boolean> {
  try {
    await docClient.send(
      new DeleteCommand({ TableName: TABLE_NAME, Key: { id } })
    );
    return true;
  } catch {
    return false;
  }
}
