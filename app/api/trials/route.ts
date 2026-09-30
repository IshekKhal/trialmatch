import { NextResponse } from 'next/server';
import { getScoreboardStats } from '@/lib/sanity';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getScoreboardStats();
    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    console.error('Error fetching trial statistics:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch trial stats.' },
      { status: 500 }
    );
  }
}
