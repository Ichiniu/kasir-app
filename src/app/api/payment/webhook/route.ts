import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { createLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
    } = body;

    const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";

    // 1. Verifikasi Signature Key Midtrans
    const payload = `${order_id}${status_code}${gross_amount}${SERVER_KEY}`;
    const calculatedSignature = crypto
      .createHash("sha512")
      .update(payload)
      .digest("hex");

    if (calculatedSignature !== signature_key) {
      console.warn("⚠️ Webhook signature mismatch. Payload rejected.");
      return NextResponse.json(
        { success: false, error: "Invalid signature key" },
        { status: 400 }
      );
    }

    console.log(`🔌 Midtrans Webhook: Order ${order_id}, Status: ${transaction_status}`);

    // 2. Proses status pembayaran di dalam database transaction
    await prisma.$transaction(async (tx) => {
      // Temukan transaksi berdasarkan invoiceNumber (order_id)
      const transaction = await tx.transaction.findUnique({
        where: { invoiceNumber: order_id },
        include: { transactionItems: true },
      });

      if (!transaction) {
        console.warn(`⚠️ Transaksi dengan Invoice ${order_id} tidak ditemukan.`);
        return;
      }

      // Hanya proses transaksi yang saat ini masih berstatus PENDING
      if (transaction.paymentStatus !== PaymentStatus.PENDING) {
        console.log(`ℹ️ Transaksi ${order_id} sudah diproses sebelumnya (Status: ${transaction.paymentStatus}).`);
        return;
      }

      // a. Jika Sukses (settlement atau capture)
      if (transaction_status === "settlement" || transaction_status === "capture") {
        // Update status transaksi ke COMPLETED
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { paymentStatus: PaymentStatus.COMPLETED },
        });

        // Tambahkan nominal transaksi ke totalSales kas register yang bersangkutan
        if (transaction.cashRegisterId) {
          await tx.cashRegister.update({
            where: { id: transaction.cashRegisterId },
            data: {
              totalSales: { increment: transaction.finalAmount },
            },
          });
        }

        console.log(`✅ Transaksi ${order_id} sukses dibayar.`);

        // Catat Audit Log
        await createLog(
          "UPDATE_TRANSACTION",
          "TRANSACTION",
          transaction.id,
          `Pembayaran QRIS Sukses untuk Invoice No. ${transaction.invoiceNumber} sebesar Rp ${Number(transaction.finalAmount).toLocaleString("id-ID")}`
        );
      } 
      // b. Jika Gagal, Batal, atau Kedaluwarsa (deny, cancel, expire)
      else if (
        transaction_status === "deny" ||
        transaction_status === "cancel" ||
        transaction_status === "expire"
      ) {
        // Update status transaksi ke CANCELLED
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { paymentStatus: PaymentStatus.CANCELLED },
        });

        // Kembalikan stok produk yang sebelumnya dikurangi/di-reserve
        for (const item of transaction.transactionItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
            },
          });
        }

        console.log(`❌ Transaksi ${order_id} dibatalkan atau kedaluwarsa. Stok produk telah dikembalikan.`);

        // Catat Audit Log
        await createLog(
          "UPDATE_TRANSACTION",
          "TRANSACTION",
          transaction.id,
          `Pembayaran QRIS Gagal/Batal/Expired untuk Invoice No. ${transaction.invoiceNumber}`
        );
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("API Webhook Midtrans Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
