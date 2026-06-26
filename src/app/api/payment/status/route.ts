import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceNumber = searchParams.get("invoiceNumber");

    if (!invoiceNumber) {
      return NextResponse.json(
        { success: false, error: "Parameter invoiceNumber wajib diisi" },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.findUnique({
      where: { invoiceNumber },
      select: {
        paymentStatus: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: "Transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentStatus: transaction.paymentStatus,
    });
  } catch (error: unknown) {
    console.error("API Payment Status Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
