import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

// 更新
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    console.log('📁 Updating folder:', id);

    const folder = await prisma.folder.update({
      where: { id },
      data: {
        name: name.trim(),
        color,
        ...(typeof sortOrder === 'number' ? { sortOrder } : {}),
      },
    });

    console.log('✅ Folder updated successfully:', folder.id);
    return NextResponse.json(folder);
  } catch (error) {
    console.error('❌ Error updating folder:');
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return NextResponse.json(
      {
        error: 'Failed to update folder',
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
    console.log('📁 Deleting folder:', id);

    await prisma.folder.delete({ where: { id } });

    console.log('✅ Folder deleted successfully');
    return NextResponse.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting folder:');
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return NextResponse.json(
      {
        error: 'Failed to delete folder',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
