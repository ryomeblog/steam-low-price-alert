import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 一覧取得
export async function GET() {
  try {
    console.log('📊 Fetching games from database');
    
    const games = await prisma.lowestPrice.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    console.log('✅ Games fetched successfully:', games.length);
    
    return NextResponse.json(games);
  } catch (error) {
    console.error('❌ Error fetching games:');
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      {
        error: 'Failed to fetch games',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 新規登録
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, steamUrl, lowestPrice } = body;

    // バリデーション
    if (!title || !steamUrl || lowestPrice === undefined) {
      return NextResponse.json(
        { error: 'Title, Steam URL, and lowest price are required' },
        { status: 400 }
      );
    }

    console.log('📊 Creating new game:', { title, steamUrl, lowestPrice });

    const game = await prisma.lowestPrice.create({
      data: {
        title,
        steamUrl,
        lowestPrice: parseInt(lowestPrice),
      },
    });
    
    console.log('✅ Game created successfully:', game.id);

    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating game:');
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      {
        error: 'Failed to create game',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
