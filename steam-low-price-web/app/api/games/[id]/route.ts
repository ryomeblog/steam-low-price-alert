import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 更新
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, steamUrl, lowestPrice } = body;

    // バリデーション
    if (!title || !steamUrl || lowestPrice === undefined) {
      return NextResponse.json(
        { error: 'Title, Steam URL, and lowest price are required' },
        { status: 400 }
      );
    }

    console.log('📊 Updating game:', id);

    const game = await prisma.lowestPrice.update({
      where: { id },
      data: {
        title,
        steamUrl,
        lowestPrice: parseInt(lowestPrice),
      },
    });

    console.log('✅ Game updated successfully:', game.id);

    return NextResponse.json(game);
  } catch (error) {
    console.error('❌ Error updating game:');
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      {
        error: 'Failed to update game',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 削除
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('📊 Deleting game:', id);

    await prisma.lowestPrice.delete({
      where: { id },
    });
    
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
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
