import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getSession, type Session } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession() as Session | null;
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_NAME);

    const intents = await db.collection('chatbot_intents')
      .find({})
      .sort({ intent: 1 })
      .toArray();

    const formattedIntents = intents.map(item => ({
      id: item._id.toString(),
      intent: item.intent,
      keywords: item.keywords || [],
      response: item.response,
      isActive: item.isActive ?? true,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));

    return NextResponse.json(formattedIntents);
  } catch (error) {
    console.error('Fetch chatbot intents error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession() as Session | null;
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { intent, keywords, response, isActive } = body;

    if (!intent || !response) {
      return NextResponse.json({ message: 'Intent and response are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_NAME);

    const newIntent = {
      intent: intent.trim(),
      keywords: Array.isArray(keywords)
        ? keywords.map((kw: string) => kw.trim()).filter(Boolean)
        : [],
      response: response.trim(),
      isActive: isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('chatbot_intents').insertOne(newIntent);

    return NextResponse.json({
      id: result.insertedId.toString(),
      ...newIntent
    });
  } catch (error) {
    console.error('Create chatbot intent error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
