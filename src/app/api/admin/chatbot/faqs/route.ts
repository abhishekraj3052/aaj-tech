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

    const faqs = await db.collection('chatbot_faqs')
      .find({})
      .sort({ category: 1, question: 1 })
      .toArray();

    const formattedFaqs = faqs.map(faq => ({
      id: faq._id.toString(),
      question: faq.question,
      answer: faq.answer,
      category: faq.category || 'General',
      keywords: faq.keywords || []
    }));

    return NextResponse.json(formattedFaqs);
  } catch (error) {
    console.error('Fetch FAQs error:', error);
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
    const { question, answer, category, keywords } = body;

    if (!question || !answer) {
      return NextResponse.json({ message: 'Question and answer are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_NAME);

    const newFaq = {
      question: question.trim(),
      answer: answer.trim(),
      category: (category || 'General').trim(),
      keywords: Array.isArray(keywords) 
        ? keywords.map((kw: string) => kw.trim()).filter(Boolean)
        : [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('chatbot_faqs').insertOne(newFaq);

    return NextResponse.json({
      id: result.insertedId.toString(),
      ...newFaq
    });
  } catch (error) {
    console.error('Create FAQ error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
