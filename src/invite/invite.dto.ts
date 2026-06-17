import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from 'src/common/role.enum';
import { InviteStatus } from 'src/common/invite-status.enum';
import { CompanySummaryDto } from 'src/company/company.dto';

export class CreateInviteDto {
  @ApiProperty()
  @IsEmail({}, { message: 'O Email deve ser válido' })
  email: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Informe ao menos uma empresa' })
  @IsUUID('4', {
    each: true,
    message: 'Cada companyId deve ser um UUID válido',
  })
  companyIds: string[];

  @ApiProperty({ enum: Role })
  @IsEnum(Role, { message: 'Role inválida' })
  role: Role;
}

export class AcceptInviteDto {
  @ApiProperty()
  @IsString({ message: 'O Token deve ser uma string' })
  @MinLength(1, { message: 'O Token é obrigatório' })
  token: string;

  @ApiProperty()
  @IsString({ message: 'O Nome deve ser uma string' })
  @MinLength(1, { message: 'O Nome é obrigatório' })
  @MaxLength(255, { message: 'O Nome deve ter no máximo 255 caracteres' })
  name: string;

  @ApiProperty()
  @IsString({ message: 'A Senha deve ser uma string' })
  @MinLength(8, {
    message: 'A Senha informada deve conter no mínimo 8 caracteres',
  })
  @MaxLength(32, {
    message: 'A Senha informada deve conter na máximo 32 caracteres',
  })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Senha fraca: sua senha deve conter números, letras maiúsculas, letras minúsculas e caracteres especiais',
  })
  password: string;
}

export class RefuseInviteDto {
  @ApiProperty()
  @IsString({ message: 'O Token deve ser uma string' })
  @MinLength(1, { message: 'O Token é obrigatório' })
  token: string;
}

export class InviteSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty({ enum: InviteStatus })
  status: InviteStatus;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  createdAt: Date;
}

export class InviteDetailDto extends InviteSummaryDto {
  @ApiProperty({ type: [CompanySummaryDto] })
  companies: CompanySummaryDto[];

  @ApiProperty({ nullable: true })
  acceptedAt?: Date | null;

  @ApiProperty({ nullable: true })
  refusedAt?: Date | null;

  @ApiProperty({ nullable: true })
  cancelledAt?: Date | null;

  @ApiProperty()
  updatedAt: Date;
}

export class InviteMessageResponseDto {
  @ApiProperty()
  message: string;
}

export class InvitePublicDetailsDto {
  @ApiProperty()
  email: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty({ enum: InviteStatus })
  status: InviteStatus;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  inviterName: string;

  @ApiProperty({ type: [CompanySummaryDto] })
  companies: CompanySummaryDto[];
}
