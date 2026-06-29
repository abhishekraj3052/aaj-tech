import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getSession, type Session } from '@/lib/auth';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request) as Session | null;
    if (!session || session.role !== 'admin') {
      console.warn('Upload FAQs Unauthorized - session:', session, 'headers cookie:', request.headers.get('cookie'));
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/);
    if (lines.length <= 1) {
      return NextResponse.json({ message: 'CSV file is empty' }, { status: 400 });
    }

    // Header validation (Question, Answer, Category, Keywords)
    const headers = parseCSVLine(lines[0].toLowerCase());
    if (headers.length < 2 || !headers[0].includes('question') || !headers[1].includes('answer')) {
      return NextResponse.json({ message: 'Invalid CSV format. Columns must be: Question, Answer, [Category], [Keywords]' }, { status: 400 });
    }

    const importedFaqs = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = parseCSVLine(line);
      if (columns.length >= 2) {
        const question = columns[0].replace(/^"|"$/g, '').trim();
        const answer = columns[1].replace(/^"|"$/g, '').trim();
        const category = (columns[2] || 'General').replace(/^"|"$/g, '').trim();
        const keywordsStr = columns[3] || '';
        const keywords = keywordsStr
          .replace(/^"|"$/g, '')
          .split(/[,;]/)
          .map(k => k.trim())
          .filter(Boolean);

        if (question && answer) {
          importedFaqs.push({
            question,
            answer,
            category,
            keywords,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }

    if (importedFaqs.length === 0) {
      return NextResponse.json({ message: 'No valid FAQs found in the CSV file' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_NAME);

    // Insert FAQs in bulk
    const result = await db.collection('chatbot_faqs').insertMany(importedFaqs);

    return NextResponse.json({
      message: `Successfully imported ${result.insertedCount} FAQs`,
      count: result.insertedCount
    });
  } catch (error) {
    console.error('Import FAQs error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
