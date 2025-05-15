// server/services/emailService.js
import nodemailer from 'nodemailer';
import { config } from '../config.js';

/**
 * Email service for sending transactional emails
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password
      }
    });
  }
  
  /**
   * Send verification email
   */
  async sendVerificationEmail({ to, name, verificationUrl }) {
    const mailOptions = {
      from: `"EkoDirekt" <${config.email.from}>`,
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
    
    return await this.transporter.sendMail(mailOptions);
  }
  
  /**
   * Send password reset email
   */
  async sendPasswordResetEmail({ to, name, resetUrl }) {
    const mailOptions = {
      from: `"EkoDirekt" <${config.email.from}>`,
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
    
    return await this.transporter.sendMail(mailOptions);
  }
  
  /**
   * Send welcome email after successful verification
   */
  async sendWelcomeEmail({ to, name }) {
    const mailOptions = {
      from: `"EkoDirekt" <${config.email.from}>`,
      to,
      subject: 'Witaj w EkoDirekt!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2E7D32;">Witaj ${name}!</h2>
          <p>Dziękujemy za dołączenie do społeczności EkoDirekt!</p>
          <p>Twoje konto zostało pomyślnie aktywowane i możesz już w pełni korzystać z naszej platformy.</p>
          <p>EkoDirekt to miejsce, gdzie lokalni rolnicy ekologiczni mogą bezpośrednio łączyć się z konsumentami. Nasza misja to wspieranie zrównoważonego rolnictwa i skracanie łańcucha dostaw.</p>
          <p>Jeśli masz jakiekolwiek pytania, nie wahaj się skontaktować z nami.</p>
          <p>Pozdrawiamy,<br>Zespół EkoDirekt</p>
        </div>
      `
    };
    
    return await this.transporter.sendMail(mailOptions);
  }
}

export const emailService = new EmailService();