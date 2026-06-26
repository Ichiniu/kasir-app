const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";

const BASE_URL = IS_PRODUCTION
  ? "https://api.midtrans.com/v2"
  : "https://api.sandbox.midtrans.com/v2";

/**
 * Mendapatkan header otorisasi Basic Auth untuk Midtrans
 */
function getAuthHeader(): string {
  const token = Buffer.from(SERVER_KEY + ":").toString("base64");
  return `Basic ${token}`;
}

interface MidtransQrisResponse {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  currency: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  fraud_status: string;
  actions?: Array<{
    name: string;
    method: string;
    url: string;
  }>;
}

/**
 * Membuat transaksi QRIS baru ke Midtrans
 * @param orderId Nomor invoice atau ID transaksi unik
 * @param amount Total tagihan (gross amount)
 * @param customerName Nama pelanggan
 */
export async function createQrisCharge(
  orderId: string,
  amount: number,
  customerName: string
): Promise<{ success: boolean; qrUrl?: string; error?: string; raw?: unknown }> {
  try {
    if (!SERVER_KEY) {
      throw new Error("MIDTRANS_SERVER_KEY belum diatur di variabel lingkungan (.env)");
    }

    const response = await fetch(`${BASE_URL}/charge`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": getAuthHeader(),
      },
      body: JSON.stringify({
        payment_type: "qris",
        transaction_details: {
          order_id: orderId,
          gross_amount: Math.round(amount), // Midtrans membutuhkan integer untuk rupiah
        },
        customer_details: {
          first_name: customerName || "Umum",
        },
        qris: {
          acquirer: "gopay",
        },
      }),
    });

    const data = (await response.json()) as MidtransQrisResponse;

    if (!response.ok || (data.status_code !== "201" && data.status_code !== "200")) {
      return {
        success: false,
        error: data.status_message || `HTTP Error ${response.status}`,
        raw: data,
      };
    }

    // Ambil URL QR Code dari actions
    const qrAction = data.actions?.find((action) => action.name === "generate-qr-code");
    if (!qrAction) {
      return {
        success: false,
        error: "Gagal mendapatkan QR Code dari respon Midtrans actions",
        raw: data,
      };
    }

    return {
      success: true,
      qrUrl: qrAction.url,
      raw: data,
    };
  } catch (error: unknown) {
    console.error("Midtrans Service Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Terjadi kesalahan koneksi ke Midtrans",
    };
  }
}
