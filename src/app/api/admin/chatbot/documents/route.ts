import { NextResponse } from 'next/server';
import { getSession, type Session } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession() as Session | null;
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://aaj-tech-backend.onrender.com';
    const secret = process.env.JWT_SECRET || 'aaj_tech_trading_super_secret_key_2024_premium_industrial';

    const backendRes = await fetch(`${backendUrl}/api/chatbot/admin/documents`, {
      headers: {
        'Authorization': `Bearer ${secret}`
      }
    });

    if (backendRes.ok) {
      const data = await backendRes.json();
      return NextResponse.json(data);
    } else {
      const errorMsg = await backendRes.text();
      return NextResponse.json({ message: `FastAPI backend error: ${errorMsg}` }, { status: backendRes.status });
    }
  } catch (error) {
    console.error('List documents proxy error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
