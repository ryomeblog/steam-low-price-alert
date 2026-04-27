import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

// 一覧取得（ゲーム件数付き）
export async function GET() {
  try {
    console.log('📁 Fetching folders from database');

    const folders = await prisma.folder.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: { select: { games: true } },
      },
    });

    const result = folders.map((f) => ({
      id: f.id,
      name: f.name,
      color: f.color,
      sortOrder: f.sortOrder,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      gameCount: f._count.games,
    }));

    console.log('✅ Folders fetched successfully:', result.length);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error fetching folders:');
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return NextResponse.json(
      {
        error: 'Failed to fetch folders',
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
    const { name, color, sortOrder } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!color || !HEX_COLOR.test(color)) {
      return NextResponse.json(
        { error: 'Color must be in #RRGGBB format' },
        { status: 400 }
      );
    }

    console.log('📁 Creating new folder:', { name, color });

    const folder = await prisma.folder.create({
      data: {
        name: name.trim(),
        color,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      },
    });

    console.log('✅ Folder created successfully:', folder.id);
    return NextResponse.json({ ...folder, gameCount: 0 }, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating folder:');
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return NextResponse.json(
      {
        error: 'Failed to create folder',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
