import { NextRequest, NextResponse } from 'next/server';
import { runFullBenchmarkSuite, BenchmarkSuiteSummary } from '@/lib/eval_runner';
import bundledEvalResults from '@/data/eval_results.json';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // If initial load and no refresh requested, return bundled benchmark results instantly
    if (!forceRefresh) {
      return NextResponse.json(bundledEvalResults);
    }

    // Run live evaluation suite dynamically across all 10 test cases
    const summary: BenchmarkSuiteSummary = await runFullBenchmarkSuite();
    return NextResponse.json(summary);
  } catch (err: any) {
    console.error('Benchmark API Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to execute benchmark suite' },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest) {
  try {
    // Run live evaluation suite dynamically across all 10 test cases
    const summary: BenchmarkSuiteSummary = await runFullBenchmarkSuite();
    return NextResponse.json(summary);
  } catch (err: any) {
    console.error('Benchmark API Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to execute benchmark suite' },
      { status: 500 }
    );
  }
}
