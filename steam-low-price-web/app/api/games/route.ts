import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

type GameWithFolders = Prisma.LowestPriceGetPayload<{
  include: { folders: { include: { folder: true } } };
}>;

const serializeGame = (g: GameWithFolders) => ({
  id: g.id,
  title: g.title,
  steamUrl: g.steamUrl,
  lowestPrice: g.lowestPrice,
  createdAt: g.createdAt,
  updatedAt: g.updatedAt,
  folders: g.folders.map((gf) => ({
    id: gf.folder.id,
    name: gf.folder.name,
    color: gf.folder.color,
  })),
});

// 一覧取得
//   - ?folderId=all       → 全件（デフォルト）
//   - ?folderId=unassigned → どのフォルダにも属さないゲーム
//   - ?folderId=<UUID>    → 指定フォルダに属するゲーム
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');

    console.log('📊 Fetching games from database', { folderId });

    let where: Prisma.LowestPriceWhereInput = {};
    if (folderId && folderId !== 'all') {
      if (folderId === 'unassigned') {
        where = { folders: { none: {} } };
      } else {
        where = { folders: { some: { folderId } } };
      }
    }

    const games = await prisma.lowestPrice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { folders: { include: { folder: true } } },
    });

    console.log('✅ Games fetched successfully:', games.length);
    return NextResponse.json(games.map(serializeGame));
  } catch (error) {
    console.error('❌ Error fetching games:');
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return NextResponse.json(
      {
        error: 'Failed to fetch games',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// 新規登録
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, steamUrl, lowestPrice, folderIds } = body;

    if (!title || !steamUrl || lowestPrice === undefined) {
      return NextResponse.json(
        { error: 'Title, Steam URL, and lowest price are required' },
        { status: 400 }
      );
    }

    const ids: string[] = Array.isArray(folderIds) ? folderIds : [];

    console.log('📊 Creating new game:', { title, steamUrl, lowestPrice, folderIds: ids });

    const game = await prisma.lowestPrice.create({
      data: {
        title,
        steamUrl,
        lowestPrice: parseInt(lowestPrice),
        folders: {
          create: ids.map((folderId) => ({ folderId })),
        },
      },
      include: { folders: { include: { folder: true } } },
    });

    console.log('✅ Game created successfully:', game.id);
    return NextResponse.json(serializeGame(game), { status: 201 });
  } catch (error) {
    console.error('❌ Error creating game:');
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return NextResponse.json(
      {
        error: 'Failed to create game',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
