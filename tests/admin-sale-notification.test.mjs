import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { compileFunction } from "node:vm";
import ts from "typescript";

// Exercise the real TypeScript modules with injected services, never live mail or DB.
function loadModule(relativePath, dependencies) {
  const filename = fileURLToPath(new URL(relativePath, import.meta.url));
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });
  const compiledModule = { exports: {} };
  compileFunction(outputText, ["require", "module", "exports"], { filename })(
    (name) => {
      assert.ok(Object.hasOwn(dependencies, name), `Unmocked dependency: ${name}`);
      return dependencies[name];
    },
    compiledModule,
    compiledModule.exports
  );
  return compiledModule.exports;
}

const utils = {
  getBaseUrl: () => "https://tickets.example.com",
  formatDate: () => "13 de noviembre de 2026",
  getMapsUrl: () => null,
};

function createFulfillment({
  paymentMethod = "MERCADOPAGO",
  capacityAvailable = true,
  ticketEmailFails = false,
  adminEmailFails = false,
} = {}) {
  const order = {
    id: "order-1",
    status: "PENDING",
    paymentMethod,
    buyerName: "Comprador de prueba",
    buyerEmail: "buyer@example.com",
    buyerPhone: null,
    buyerDni: null,
    quantity: 2,
    totalArs: 10000,
    showId: "show-1",
    tierId: "tier-1",
    mpPaymentId: null,
    show: {
      title: "CAPITAN",
      startsAt: new Date("2026-11-14T00:30:00Z"),
      venue: "Little John",
      address: null,
      mapUrl: null,
      sheetTab: null,
    },
    tier: { name: "Promo 2 x 1" },
    tickets: [],
  };
  const sent = { buyer: [], admin: [], sheets: [] };
  let committed = false;
  const prisma = {
    order: {
      findUnique: async () => order,
      update: async ({ data }) => data,
    },
    ticket: { create: async ({ data }) => data },
    $executeRawUnsafe: async () => (capacityAvailable ? 1 : 0),
    $transaction: async (operations) => {
      const results = await Promise.all(operations);
      order.status = "PAID";
      committed = true;
      return results;
    },
  };
  const { fulfillOrder } = loadModule("../src/lib/orders/fulfill.ts", {
    "@/lib/db": { prisma },
    "@/lib/tickets/qr": { generateQrToken: () => "test-token" },
    "@/lib/tickets/code": { generateTicketCode: () => "test-code" },
    "@/lib/email/service": {
      sendTicketEmail: async (data) => {
        sent.buyer.push(data);
        if (ticketEmailFails) throw new Error("Buyer mail unavailable");
      },
      sendAdminSaleNotification: async (data) => {
        assert.equal(committed, true, "Notify only after the transaction commits");
        sent.admin.push(data);
        if (adminEmailFails) throw new Error("Admin mail unavailable");
      },
    },
    "@/lib/sheets/append": {
      appendSaleToSheet: async (data) => sent.sheets.push(data),
    },
    "@/lib/utils": utils,
  });
  return { fulfillOrder, sent, order };
}

test("an approved Mercado Pago order notifies admins once after fulfillment", async () => {
  const { fulfillOrder, sent } = createFulfillment();
  const options = { orderId: "order-1", mpPaymentId: "payment-1" };

  assert.deepEqual(await fulfillOrder(options), { success: true });
  assert.deepEqual(await fulfillOrder(options), { success: true });

  assert.equal(sent.admin.length, 1);
  assert.equal(sent.buyer.length, 1);
  assert.equal(sent.sheets.length, 1);
  assert.deepEqual(sent.admin[0], {
    orderId: "order-1",
    buyerName: "Comprador de prueba",
    buyerEmail: "buyer@example.com",
    buyerPhone: undefined,
    showTitle: "CAPITAN",
    tierName: "Promo 2 x 1",
    quantity: 2,
    totalArs: 10000,
    paymentId: "payment-1",
    adminUrl: "https://tickets.example.com/admin/orders",
  });
});

test("transfers and guest orders keep their existing notification behavior", async () => {
  for (const paymentMethod of ["TRANSFER", "GUEST"]) {
    const { fulfillOrder, sent } = createFulfillment({ paymentMethod });
    assert.deepEqual(await fulfillOrder({ orderId: "order-1" }), { success: true });
    assert.equal(sent.admin.length, 0);
    assert.equal(sent.buyer.length, 1);
  }
});

test("a sale that cannot be fulfilled does not send a confirmation", async () => {
  const { fulfillOrder, sent } = createFulfillment({ capacityAvailable: false });
  assert.deepEqual(await fulfillOrder({ orderId: "order-1" }), {
    success: false,
    error: "oversold",
  });
  assert.equal(sent.admin.length, 0);
  assert.equal(sent.buyer.length, 0);
  assert.equal(sent.sheets.length, 0);
});

test("a buyer email failure does not prevent the admin notification", async (t) => {
  t.mock.method(console, "error", () => {});
  const { fulfillOrder, sent } = createFulfillment({ ticketEmailFails: true });
  assert.deepEqual(await fulfillOrder({ orderId: "order-1" }), { success: true });
  assert.equal(sent.admin.length, 1);
  assert.equal(sent.sheets.length, 1);
});

test("an admin email failure does not undo tickets or prevent Sheets sync", async (t) => {
  t.mock.method(console, "error", () => {});
  const { fulfillOrder, sent, order } = createFulfillment({ adminEmailFails: true });
  assert.deepEqual(await fulfillOrder({ orderId: "order-1" }), { success: true });
  assert.equal(order.status, "PAID");
  assert.equal(sent.buyer.length, 1);
  assert.equal(sent.sheets.length, 1);
});

function emailService(t, adminEmails) {
  const previous = process.env.ADMIN_EMAILS;
  process.env.ADMIN_EMAILS = adminEmails;
  t.after(() => {
    if (previous === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = previous;
  });
  const messages = [];
  const service = loadModule("../src/lib/email/service.ts", {
    nodemailer: {
      createTransport: () => ({ sendMail: async (mail) => messages.push(mail) }),
    },
    "@/lib/utils": utils,
  });
  return { ...service, messages };
}

const sale = {
  orderId: "order-1",
  buyerName: '<img src="x" onerror="alert(1)">',
  buyerEmail: "buyer@example.com",
  buyerPhone: "11 5555 5555",
  showTitle: "CAPITAN & amigos",
  tierName: "Promo 2 x 1",
  quantity: 2,
  totalArs: 10000,
  paymentId: "payment-1",
  adminUrl: "https://tickets.example.com/admin/orders",
};

test("the sale email includes payment details, a sales link and escaped buyer data", async (t) => {
  const { sendAdminSaleNotification, messages } = emailService(
    t,
    " admin@example.com, , second@example.com,admin@example.com "
  );
  await sendAdminSaleNotification(sale);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].to, "admin@example.com,second@example.com");
  assert.match(messages[0].subject, /Venta confirmada:.*\$10\.000/);
  assert.match(messages[0].html, /Pago aprobado por Mercado Pago/);
  assert.match(messages[0].html, /Promo 2 x 1 x 2/);
  assert.match(messages[0].html, /order-1/);
  assert.match(messages[0].html, /payment-1/);
  assert.match(messages[0].html, /admin\/orders/);
  assert.match(messages[0].html, /CAPITAN &amp; amigos/);
  assert.ok(!messages[0].html.includes(sale.buyerName));
  assert.match(messages[0].html, /&lt;img src=&quot;x&quot;/);
  assert.ok(!messages[0].html.includes("Confirmar pago"));
});

test("no email is sent when the admin recipient list is empty", async (t) => {
  const { sendAdminSaleNotification, messages } = emailService(t, " , ");
  await sendAdminSaleNotification(sale);
  assert.equal(messages.length, 0);
});
