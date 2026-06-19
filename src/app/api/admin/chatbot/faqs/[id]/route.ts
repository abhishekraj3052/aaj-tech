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
      return NextResponse.json({ message: 'Invalid FAQ ID' }, { status: 400 });
    }

    const body = await request.json();
    const { question, answer, category, keywords } = body;

    if (!question || !answer) {
      return NextResponse.json({ message: 'Question and answer are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_NAME);

    const updateData = {
      question: question.trim(),
      answer: answer.trim(),
      category: (category || 'General').trim(),
      keywords: Array.isArray(keywords) 
        ? keywords.map((kw: string) => kw.trim()).filter(Boolean)
        : [],
      updatedAt: new Date()
    };

    const result = await db.collection('chatbot_faqs').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'FAQ not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'FAQ updated successfully' });
  } catch (error) {
    console.error('Update FAQ error:', error);
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
      return NextResponse.json({ message: 'Invalid FAQ ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_NAME);

    const result = await db.collection('chatbot_faqs').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'FAQ not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Delete FAQ error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
