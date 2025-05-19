// backend/services/emailService.ts - Ulepszona wersja z debuggingiem
import nodemailer from 'nodemailer';
import { config } from '../config';

/**
 * Email service for sending transactional emails using Gmail
 */
class EmailService {
  private transporter: nodemailer.Transporter;
  
  constructor() {
    console.log('Konfiguracja emaila:', {
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      user: config.email.user,
      hasPassword: !!config.email.password,
      from: config.email.from
    });

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password
      },
      debug: true, // Włącz szczegółowe logowanie
      logger: true // Włącz logger
    });

    // Przetestuj połączenie
    this.testConnection();
  }

  /**
   * Test email configuration
   */
  private async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email transporter is ready to send emails');
    } catch (error) {
      console.error('❌ Email transporter error:', error);
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
      console.log(`Wysyłanie emaila resetowania hasła do: ${to}`);
      
      const mailOptions = {
        from: `"EkoDirekt" <${config.email.user}>`,
        to,
        subject: 'Resetowanie hasła - EkoDirekt',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2E7D32; margin: 0;">EkoDirekt</h1>
                <p style="color: #666; margin-top: 5px;">Platforma ekologicznych produktów</p>
              </div>
              
              <h2 style="color: #2E7D32; margin-bottom: 20px;">Cześć ${name}!</h2>
              
              <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
                Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w serwisie EkoDirekt.
              </p>
              
              <p style="color: #333; line-height: 1.6; margin-bottom: 30px;">
                Aby ustawić nowe hasło, kliknij w poniższy przycisk:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background-color: #2E7D32; 
                          color: white; 
                          text-decoration: none; 
                          padding: 15px 30px; 
                          border-radius: 5px; 
                          display: inline-block;
                          font-weight: bold;">
                  Resetuj hasło
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                Link jest ważny przez 1 godzinę. Jeśli przycisk nie działa, skopiuj poniższy link do przeglądarki:
              </p>
              
              <p style="color: #666; font-size: 12px; word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 5px;">
                ${resetUrl}
              </p>
              
              <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.
                </p>
                <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
                  Pozdrawiamy,<br>Zespół EkoDirekt
                </p>
              </div>
            </div>
          </div>
        `,
        text: `
          Cześć ${name}!
          
          Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w serwisie EkoDirekt.
          
          Aby ustawić nowe hasło, użyj tego linku: ${resetUrl}
          
          Link jest ważny przez 1 godzinę.
          
          Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.
          
          Pozdrawiamy,
          Zespół EkoDirekt
        `
      };
      
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      throw error;
    }
  }

  /**
   * Send test email to verify configuration
   */
  async sendTestEmail(to: string) {
    try {
      console.log(`Wysyłanie testowego emaila do: ${to}`);
      
      const mailOptions = {
        from: `"EkoDirekt Test" <${config.email.user}>`,
        to,
        subject: 'Test Email - EkoDirekt',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #2E7D32;">Test Email</h2>
            <p>Ten email potwierdza, że konfiguracja emaila działa poprawnie.</p>
            <p>Wysłano: ${new Date().toLocaleString('pl-PL')}</p>
          </div>
        `,
        text: `
          Test Email
          
          Ten email potwierdza, że konfiguracja emaila działa poprawnie.
          
          Wysłano: ${new Date().toLocaleString('pl-PL')}
        `
      };
      
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Test email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending test email:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();