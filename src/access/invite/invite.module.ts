import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invite } from './invite.entity';
import { InviteService } from './invite.service';
import { InviteController } from './invite.controller';
import { Company } from 'src/access/company/company.entity';
import { User } from 'src/access/user/user.entity';
import { UserCompany } from 'src/access/user-company/user-company.entity';
import { MailModule } from 'src/system/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invite, Company, User, UserCompany]),
    MailModule,
  ],
  providers: [InviteService],
  controllers: [InviteController],
  exports: [InviteService],
})
export class InviteModule {}
