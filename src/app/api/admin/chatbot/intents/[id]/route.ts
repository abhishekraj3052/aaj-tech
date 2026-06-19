import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getSession, type Session } from '@/lib/auth';
import { ObjectId } from 'mongodb';

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function PUT(
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
      return NextResponse.json({ message: 'Invalid Intent ID' }, { status: 400 });
    }

    const body = await request.json();
    const { intent, keywords, response, isActive } = body;

    const updateData: any = {
      updatedAt: new Date()
    };

    if (intent !== undefined) updateData.intent = intent.trim();
    if (keywords !== undefined) {
      updateData.keywords = Array.isArray(keywords)
        ? keywords.map((kw: string) => kw.trim()).filter(Boolean)
        : [];
    }
    if (response !== undefined) updateData.response = response.trim();
    if (isActive !== undefined) updateData.isActive = !!isActive;

    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_NAME);

    const result = await db.collection('chatbot_intents').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Intent not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Intent updated successfully' });
  } catch (error) {
    console.error('Update chatbot intent error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
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
      return NextResponse.json({ message: 'Invalid Intent ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_NAME);

    const result = await db.collection('chatbot_intents').deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Intent not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Intent deleted successfully' });
  } catch (error) {
    console.error('Delete chatbot intent error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
