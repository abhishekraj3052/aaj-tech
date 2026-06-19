import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getSession, type Session } from '@/lib/auth';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_NAME);

    let settings = await db.collection('chatbot_settings').findOne({ _id: 'global_settings' as any }) as any;

    if (!settings) {
      // Create default settings if not exists
      const defaultSettings = {
        _id: 'global_settings',
        greetingMessage: 'Hello! Welcome to Aaj Tech Trading. How can I help you today?',
        fallbackMessage: "I'm sorry, I couldn't find an answer to your question. Would you like to submit an inquiry or contact us on WhatsApp?",
        whatsappNumber: '9910009227', // Use current default from WhatsAppButton
        updatedAt: new Date()
      };
      await db.collection('chatbot_settings').insertOne(defaultSettings as any);
      settings = defaultSettings as any;
    }

    return NextResponse.json({
      greetingMessage: settings.greetingMessage,
      fallbackMessage: settings.fallbackMessage,
      whatsappNumber: settings.whatsappNumber
    });
  } catch (error) {
    console.error('Fetch chatbot settings error:', error);
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
    const { greetingMessage, fallbackMessage, whatsappNumber } = body;

    if (!greetingMessage || !fallbackMessage || !whatsappNumber) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_NAME);

    const updateData = {
      greetingMessage: greetingMessage.trim(),
      fallbackMessage: fallbackMessage.trim(),
      whatsappNumber: whatsappNumber.trim(),
      updatedAt: new Date()
    };

    await db.collection('chatbot_settings').updateOne(
      { _id: 'global_settings' as any },
      { $set: updateData },
      { upsert: true }
    );

    return NextResponse.json({ message: 'Chatbot settings updated successfully' });
  } catch (error) {
    console.error('Save chatbot settings error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
