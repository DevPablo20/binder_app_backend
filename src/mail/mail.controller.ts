import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Private } from '../auth/decorators/private.decorator';
import { Role } from '../auth/roles/roles.enum';
import { MailService } from './mail.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Mail')
@Private(Role.Superadmin)
@Controller('mail')
export class MailController {
    constructor(private mailService: MailService) { }

    @Post('send')
    @ApiOperation({ summary: 'Send Email', description: 'Send email to user' })
    @HttpCode(HttpStatus.OK)
    async sendEmail() {
        const email = "jaberpablo@gmail.com"
        const name = "Pablo"
        const subject = "Reset de senha"
        const text = "Clique para redefinir a senha"

        await this.mailService.sendMail({ email, name }, subject, text)
        return { message: 'Email enviado com sucesso!' }
    }
}
