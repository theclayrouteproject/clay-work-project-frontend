import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const glazesPath = path.join(process.cwd(), 'app/glazes/database/glazes.data.json');
    const data = await fs.readFile(glazesPath, 'utf8');
    const glazes = JSON.parse(data);

    return Response.json(glazes);
  } catch (error) {
    console.error('Failed to load glazes:', error);
    return Response.json([], { status: 200 });
  }
}
