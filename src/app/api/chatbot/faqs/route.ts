import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_NAME);
    
    // Retrieve first 6 FAQs for public quick help suggestions
    const faqs = await db.collection('chatbot_faqs')
      .find({})
      .limit(6)
      .toArray();

    // Map _id to string id
    const formattedFaqs = faqs.map(faq => ({
      id: faq._id.toString(),
      question: faq.question,
      answer: faq.answer,
      category: faq.category || 'General',
      keywords: faq.keywords || []
    }));

    return NextResponse.json(formattedFaqs);
  } catch (error: any) {
    console.error('Fetch suggestions FAQs error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
