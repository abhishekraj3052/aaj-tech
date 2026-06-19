import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { sendLeadNotificationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, phone, message, sessionId } = body;

    if (!fullName || !email || !phone || !message) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_NAME);

    // Save lead record
    const newLead = {
      fullName,
      email,
      phone,
      message,
      status: 'New',
      createdAt: new Date()
    };

    const result = await db.collection('chatbot_leads').insertOne(newLead);

    // If there is an active chatbot conversation, update it with the user's name
    if (sessionId) {
      await db.collection('chatbot_conversations').updateOne(
        { sessionId: sessionId },
        { $set: { fullName: fullName } }
      );
    }

    // Send notification email in background/async
    try {
      await sendLeadNotificationEmail({ fullName, email, phone, message });
    } catch (emailErr) {
      console.error('Failed to send lead notification email:', emailErr);
    }

    return NextResponse.json({
      message: 'Inquiry submitted successfully',
      id: result.insertedId.toString()
    });
  } catch (error: any) {
    console.error('Chatbot lead creation error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
