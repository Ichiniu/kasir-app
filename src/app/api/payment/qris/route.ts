import { NextRequest, NextResponse } from "next/server";
import { createTransaction } from "@/app/(dashboard)/kasir/actions";
import { createQrisCharge } from "@/lib/midtrans";
import { PaymentMethod, PaymentStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Pastikan metode pembayaran adalah QRIS dan statusnya PENDING
    const transactionData = {
      ...body,
      paymentMethod: PaymentMethod.QRIS,
      paymentStatus: PaymentStatus.PENDING,
      cashReceived: 0,
      changeAmount: 0,
    };

    // 1. Buat transaksi dengan status PENDING di database
    const txResult = await createTransaction(transactionData);

    if (!txResult.success || !txResult.transaction) {
      return NextResponse.json(
        { success: false, error: txResult.error || "Gagal membuat transaksi pending" },
        { status: 400 }
      );
    }

    const transaction = txResult.transaction;

    // 2. Hubungi Midtrans API untuk men-charge QRIS
    const midtransResult = await createQrisCharge(
      transaction.invoiceNumber,
      transaction.finalAmount,
      transaction.customerName || "Umum"
    );

    if (!midtransResult.success || !midtransResult.qrUrl) {
      // Catatan: Di sistem produksi, jika Midtrans gagal, kita bisa membatalkan transaksi yang dibuat
      // Namun untuk kemudahan, kita cukup kembalikan error
      return NextResponse.json(
        {
          success: false,
          error: midtransResult.error || "Gagal memproses QRIS ke Midtrans",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invoiceNumber: transaction.invoiceNumber,
      qrUrl: midtransResult.qrUrl,
      finalAmount: transaction.finalAmount,
    });
  } catch (error: unknown) {
    console.error("API Payment QRIS Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
