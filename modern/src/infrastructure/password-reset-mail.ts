import nodemailer from "nodemailer";
import type { PasswordResetNotifier } from "../domain/auth.js";

export type PasswordResetMailOptions = {
  host: string;
  port: number;
  secure: boolean;
  user: string | null;
  password: string | null;
  from: string;
  resetUrl: string;
};

export function createPasswordResetMailNotifier(
  options: PasswordResetMailOptions,
): PasswordResetNotifier {
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
      const resetUrl = new URL(options.resetUrl);
      resetUrl.searchParams.set("token", input.token);

      await transporter.sendMail({
        from: options.from,
        to: input.email,
        subject: "Restablecé tu contraseña de Meow Matrix",
        text: [
          "Recibimos una solicitud para restablecer tu contraseña de Meow Matrix.",
          "",
          `Abrí este enlace antes de ${new Date(input.expiresAt).toISOString()}:`,
          resetUrl.toString(),
          "",
          "Si no hiciste esta solicitud, podés ignorar este mensaje.",
        ].join("\n"),
      });
    },
  };
}
