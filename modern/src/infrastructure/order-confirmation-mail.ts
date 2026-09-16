import nodemailer from "nodemailer";
import type { OrderConfirmationNotifier } from "../domain/outbox-delivery.js";

export type OrderConfirmationMailOptions = {
  host: string;
  port: number;
  secure: boolean;
  user: string | null;
  password: string | null;
  from: string;
};

export function createOrderConfirmationMailNotifier(
  options: OrderConfirmationMailOptions,
): OrderConfirmationNotifier {
  const transporter = nodemailer.createTransport({
    host: options.host,
    port: options.port,
    secure: options.secure,
    ...(options.user && options.password
      ? { auth: { user: options.user, pass: options.password } }
      : {}),
  });

  return {
    async send(input) {
      const lines = input.order.lines.map(
        (line) =>
          `- ${line.name} x${line.quantity}: ${line.lineTotal.toFixed(2)}`,
      );
      await transporter.sendMail({
        from: options.from,
        to: input.email,
        messageId: `<meow-order-${input.order.id}@meow-matrix.invalid>`,
        subject: `Orden ${input.order.code} confirmada`,
        text: [
          `Hola ${input.name},`,
          "",
          "Tu orden de Meow Matrix quedó confirmada.",
          "",
          ...lines,
          "",
          `Total: ${input.order.total.toFixed(2)}`,
          "",
          "Este correo confirma la orden registrada; no implica por sí solo una captura de pago externa.",
        ].join("\n"),
      });
    },
  };
}
