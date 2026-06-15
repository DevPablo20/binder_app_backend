import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

@Injectable()
export class MailService {
  private mailer: MailerSend;
  constructor(private config: ConfigService) {
    this.mailer = new MailerSend({
      apiKey: this.config.get('MAIL_API_KEY') || '',
    });
  }

  async sendMail(
    to: { email: string; name?: string },
    subject: string,
    text?: string,
  ) {
    const emailParams = new EmailParams()
      .setFrom(
        new Sender(
          this.config.get('MAIL_FROM_EMAIL') || '',
          this.config.get('MAIL_FROM_NAME'),
        ),
      )
      .setTo([new Recipient(to.email, to.name)])
      .setSubject(subject);

    if (text) emailParams.setText(text);

    try {
      return await this.mailer.email.send(emailParams);
    } catch (err) {
      console.error(err);
      throw new HttpException(
        'Falha ao enviar e-mail',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Envia email de convite para novo usuário
   * @param email Email do convidado
   * @param token Token único do convite
   * @param inviterName Nome de quem está convidando
   * @param role Role que será atribuída ao convidado
   */
  async sendInviteEmail(
    email: string,
    token: string,
    inviterName: string,
    role: string,
  ) {
    const frontendHost = this.config.get('FRONTEND_HOST');
    const acceptLink = `${frontendHost}/invite/accept/${token}`;
    const refuseLink = `${frontendHost}/invite/refuse/${token}`;

    const subject = `🔗 Convite para ${inviterName} - Plataforma Binder`;

    const text = `
Olá!

Você foi convidado(a) por ${inviterName} para participar da Plataforma Binder.

📋 Detalhes do convite:
• Convidado por: ${inviterName}
• Sua função será: ${role}
• Token do convite: ${token}

🔗 Para aceitar o convite, clique no link abaixo:
${acceptLink}

❌ Para recusar o convite, clique aqui:
${refuseLink}

⏰ Este convite expira em 7 dias.

Para aceitar o convite agora, envie uma requisição POST para /invite/accept com:
• token: ${token}
• name: seu nome
• password: sua senha

Para recusar o convite agora, envie uma requisição POST para /invite/refuse com:
• token: ${token}

Se você não conseguir clicar nos links, copie e cole o token abaixo no sistema:
Token: ${token}

Atenciosamente,
Equipe Binder - App
        `;

    try {
      return await this.sendMail({ email }, subject, text);
    } catch (err) {
      throw new HttpException(
        `Falha ao enviar convite para ${email}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendPasswordResetEmail(email: string, name: string, token: string) {
    const frontendHost = this.config.get('FRONTEND_HOST');
    const resetLink = `${frontendHost}/password/reset/${token}`;

    const subject = 'Redefinição de senha - Plataforma Binder';

    const text = `
Olá, ${name}!

Recebemos uma solicitação para redefinir sua senha na Plataforma Binder.

🔑 Token de redefinição:
${token}

🔗 Quando o frontend estiver disponível, use este link:
${resetLink}

Para redefinir sua senha agora, envie uma requisição POST para /auth/password/reset com:
• token: ${token}
• password: sua nova senha

⏰ Este token expira em 15 minutos.

Se você não solicitou a redefinição de senha, ignore este email.

Atenciosamente,
Equipe Binder - App
        `;

    try {
      return await this.sendMail({ email, name }, subject, text);
    } catch (err) {
      throw new HttpException(
        `Falha ao enviar email de redefinição para ${email}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
