import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getSession, type Session } from '@/lib/auth';
import { ObjectId } from 'mongodb';

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function DELETE(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const session = await getSession() as Session | null;
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Session ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_NAME);

    const result = await db.collection('chatbot_conversations').deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
