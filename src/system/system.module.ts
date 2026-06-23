import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [DatabaseModule, MailModule],
  exports: [DatabaseModule, MailModule],
})
export class SystemModule {}
