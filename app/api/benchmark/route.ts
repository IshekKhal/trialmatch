import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { runFullBenchmarkSuite, BenchmarkSuiteSummary } from '@/lib/eval_runner';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    const resultsPath = path.join(process.cwd(), 'data', 'eval_results.json');

    // If cached results exist and no refresh requested, return cached data immediately
    if (!forceRefresh && fs.existsSync(resultsPath)) {
      try {
        const cached = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
        return NextResponse.json(cached);
      } catch {
        // Fall through to run
      }
    }

    // Run benchmark suite
    const summary: BenchmarkSuiteSummary = await runFullBenchmarkSuite();

    // Cache results
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(resultsPath, JSON.stringify(summary, null, 2), 'utf-8');

    return NextResponse.json(summary);
  } catch (err: any) {
    console.error('Benchmark API Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to execute benchmark suite' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const forceRefresh = body?.refresh !== false;

    const summary: BenchmarkSuiteSummary = await runFullBenchmarkSuite();

    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const resultsPath = path.join(dataDir, 'eval_results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(summary, null, 2), 'utf-8');

    return NextResponse.json(summary);
  } catch (err: any) {
    console.error('Benchmark API Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to execute benchmark suite' },
      { status: 500 }
    );
  }
}
