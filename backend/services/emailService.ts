// backend/services/emailService.ts - zmodyfikowana wersja dla Gmail
import nodemailer from 'nodemailer';
import { config } from '../config';

/**
 * Email service for sending transactional emails using Gmail
 */
class EmailService {
  private transporter: nodemailer.Transporter;
  
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.email.user, // your-email@gmail.com
        pass: config.email.password // hasło aplikacji (nie zwykłe hasło!)
      }
    });
  }
  
  /**
   * Send verification email
   */
  async sendVerificationEmail({ to, name, verificationUrl }: {
    to: string;
    name: string;
    verificationUrl: string;
  }) {
    try {
      const mailOptions = {
        from: `"EkoDirekt" <${config.email.user}>`,
        to,
        subject: 'Potwierdź swój adres email - EkoDirekt',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2E7D32;">Witaj ${name}!</h2>
            <p>Dziękujemy za rejestrację w serwisie EkoDirekt. Aby aktywować swoje konto, kliknij w poniższy link:</p>
            <p style="margin: 20px 0;">
              <a href="${verificationUrl}" style="background-color: #2E7D32; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; display: inline-block;">
                Potwierdź adres email
              </a>
            </p>
            <p>Link jest ważny przez 24 godziny.</p>
            <p>Jeśli nie rejestrowałeś się w serwisie EkoDirekt, zignoruj tę wiadomość.</p>
            <p>Pozdrawiamy,<br>Zespół EkoDirekt</p>
          </div>
        `
      };
      
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
  
  /**
   * Send password reset email
   */
  async sendPasswordResetEmail({ to, name, resetUrl }: {
    to: string;
    name: string;
    resetUrl: string;
  }) {
    try {
      const mailOptions = {
        from: `"EkoDirekt" <${config.email.user}>`,
        to,
        subject: 'Resetowanie hasła - EkoDirekt',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2E7D32;">Witaj ${name}!</h2>
            <p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w serwisie EkoDirekt. Aby ustawić nowe hasło, kliknij w poniższy link:</p>
            <p style="margin: 20px 0;">
              <a href="${resetUrl}" style="background-color: #2E7D32; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; display: inline-block;">
                Resetuj hasło
              </a>
            </p>
            <p>Link jest ważny przez 1 godzinę.</p>
            <p>Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.</p>
            <p>Pozdrawiamy,<br>Zespół EkoDirekt</p>
          </div>
        `
      };
      
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();