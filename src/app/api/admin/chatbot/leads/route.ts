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

    const leads = await db.collection('chatbot_leads')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const formattedLeads = leads.map(lead => ({
      id: lead._id.toString(),
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      message: lead.message,
      status: lead.status || 'New',
      createdAt: lead.createdAt
    }));

    return NextResponse.json(formattedLeads);
  } catch (error) {
    console.error('Fetch chatbot leads error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
