import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db";
import { createPreference } from "@/lib/mp/client";
import { sendAdminTransferNotification } from "@/lib/email/service";

const checkoutSchema = z.object({
  showId: z.string(),
  tierId: z.string(),
  quantity: z.int().min(1).max(10),
  buyerName: z.string().min(1),
  buyerEmail: z.email(),
  buyerPhone: z.string().optional(),
  buyerDni: z
    .string()
    .regex(/^\d{7,8}$/, "DNI debe tener 7 u 8 dígitos")
    .optional(),
  paymentMethod: z.enum(["mercadopago", "transfer"]).default("mercadopago"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = checkoutSchema.parse(body);

    const tier = await prisma.ticketTier.findUnique({
      where: { id: data.tierId },
      include: { show: true },
    });

    if (!tier || tier.showId !== data.showId) {
      return NextResponse.json(
        { error: "Tier no encontrado" },
        { status: 404 }
      );
    }

    if (!tier.isActive) {
      return NextResponse.json({ error: "Tier agotado" }, { status: 400 });
    }

    if (tier.soldCount + data.quantity > tier.capacity) {
      return NextResponse.json(
        { error: "No hay suficientes entradas disponibles" },
        { status: 400 }
      );
    }

    const unitPrice = tier.priceArs;
    const totalArs = unitPrice * data.quantity;
    const paymentMethod =
      data.paymentMethod === "transfer" ? "TRANSFER" : "MERCADOPAGO";

    const order = await prisma.order.create({
      data: {
        showId: data.showId,
        tierId: data.tierId,
        buyerName: data.buyerName,
        buyerEmail: data.buyerEmail,
        buyerPhone: data.buyerPhone,
        buyerDni: data.buyerDni,
        quantity: data.quantity,
        unitPriceArs: unitPrice,
        totalArs,
        paymentMethod,
      },
    });

    // Transfer: no MP preference needed, redirect to transfer instructions
    if (data.paymentMethod === "transfer") {
      // Notify admin(s) about pending transfer (fire and forget but await for serverless)
      const requestUrl = new URL(req.url);
      const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
      try {
        await sendAdminTransferNotification({
          orderId: order.id,
          buyerName: data.buyerName,
          buyerEmail: data.buyerEmail,
          buyerPhone: data.buyerPhone,
          showTitle: `${tier.show.title} - ${tier.name}`,
          tierName: tier.name,
          quantity: data.quantity,
          totalArs: totalArs,
          adminUrl: `${baseUrl}/admin/orders`,
        });
      } catch (e) {
        console.error("Admin notification failed:", e);
      }

      return NextResponse.json({
        redirect: `/payment/transfer?order=${order.id}`,
      });
    }

    // Mercado Pago: create preference and redirect
    const requestUrl = new URL(req.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
    const preference = await createPreference({
      items: [
        {
          id: tier.id,
          title: `${tier.show.title} - ${tier.name}`,
          quantity: data.quantity,
          unit_price: unitPrice,
          currency_id: "ARS",
        },
      ],
      payer: { name: data.buyerName, email: data.buyerEmail },
      external_reference: order.id,
      notification_url: `${baseUrl}/api/webhooks/mp`,
      back_urls: {
        success: `${baseUrl}/payment/success?order=${order.id}`,
        failure: `${baseUrl}/payment/failure?order=${order.id}`,
        pending: `${baseUrl}/payment/pending?order=${order.id}`,
      },
      auto_return: "approved",
      statement_descriptor: "CAPITAN",
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { mpPreferenceId: preference.id },
    });

    const isSandbox = process.env.MP_SANDBOX === "true";
    const initPoint = isSandbox
      ? preference.sandbox_init_point
      : preference.init_point;

    return NextResponse.json({ initPoint });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
