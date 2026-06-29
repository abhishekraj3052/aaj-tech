import { NextResponse } from 'next/server';
import { getSession, type Session } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // 1. Check Admin Session
    const session = await getSession(request) as Session | null;
    if (!session || session.role !== 'admin') {
      console.warn('Upload PDF Unauthorized - session:', session, 'headers cookie:', request.headers.get('cookie'));
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 2. Extract File from Form Data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    // 3. Construct Forwarding Form Data
    const backendFormData = new FormData();
    backendFormData.append('file', file);

    // 4. Query FastAPI Backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://aaj-tech-backend.onrender.com';
    const secret = process.env.JWT_SECRET || 'aaj_tech_trading_super_secret_key_2024_premium_industrial';

    const backendRes = await fetch(`${backendUrl}/api/chatbot/admin/upload-pdf`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`
      },
      body: backendFormData
    });

    if (backendRes.ok) {
      const data = await backendRes.json();
      return NextResponse.json(data);
    } else {
      const errorMsg = await backendRes.text();
      return NextResponse.json({ message: `FastAPI backend error: ${errorMsg}` }, { status: backendRes.status });
    }
  } catch (error: any) {
    console.error('Upload PDF proxy error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
