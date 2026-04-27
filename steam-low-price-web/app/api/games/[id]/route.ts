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

// 更新
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, steamUrl, lowestPrice, folderIds } = body;

    if (!title || !steamUrl || lowestPrice === undefined) {
      return NextResponse.json(
        { error: 'Title, Steam URL, and lowest price are required' },
        { status: 400 }
      );
    }

    console.log('📊 Updating game:', id);

    // folderIds が配列で来た場合のみ所属フォルダを差し替える
    const game = await prisma.$transaction(async (tx) => {
      const updated = await tx.lowestPrice.update({
        where: { id },
        data: {
          title,
          steamUrl,
          lowestPrice: parseInt(lowestPrice),
        },
      });

      if (Array.isArray(folderIds)) {
        await tx.gameFolder.deleteMany({ where: { gameId: id } });
        if (folderIds.length > 0) {
          await tx.gameFolder.createMany({
            data: folderIds.map((folderId: string) => ({
              gameId: id,
              folderId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.lowestPrice.findUniqueOrThrow({
        where: { id: updated.id },
        include: { folders: { include: { folder: true } } },
      });
    });

    console.log('✅ Game updated successfully:', game.id);
    return NextResponse.json(serializeGame(game));
  } catch (error) {
    console.error('❌ Error updating game:');
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return NextResponse.json(
      {
        error: 'Failed to update game',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// 削除（中間テーブルはカスケードで自動削除）
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('📊 Deleting game:', id);

    await prisma.lowestPrice.delete({ where: { id } });

    console.log('✅ Game deleted successfully');
    return NextResponse.json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting game:');
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return NextResponse.json(
      {
        error: 'Failed to delete game',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
