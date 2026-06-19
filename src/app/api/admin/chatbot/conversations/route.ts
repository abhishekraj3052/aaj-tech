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

    const conversations = await db.collection('chatbot_conversations')
      .find({})
      .sort({ updatedAt: -1 })
      .limit(100) // Retrieve up to 100 recent sessions
      .toArray();

    const formattedConversations = conversations.map(convo => ({
      id: convo._id.toString(),
      sessionId: convo.sessionId,
      fullName: convo.fullName || 'Anonymous Visitor',
      messages: convo.messages || [],
      createdAt: convo.createdAt,
      updatedAt: convo.updatedAt
    }));

    return NextResponse.json(formattedConversations);
  } catch (error) {
    console.error('Fetch chatbot conversations error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
