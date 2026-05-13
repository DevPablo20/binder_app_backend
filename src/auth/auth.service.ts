import { Inject, Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { DATA_SOURCE, USER_REPOSITORY } from '../database/constants';
import { DataSource, MoreThan, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/user.entity';
import { compare, hash } from 'bcrypt';
import { ForgottenPasswordDTO, LoginDTO, ResetPasswordDTO } from './auth.dto';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name)
    constructor(
        @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
        @Inject(USER_REPOSITORY) private readonly userRepository: Repository<User>,
        private configService: ConfigService,
        private readonly jwtService: JwtService,
    ) { }

    async login(res: Response, { email, password }: LoginDTO) {
        const queryRunner = this.dataSource.createQueryRunner()
        await queryRunner.connect();
        await queryRunner.startTransaction()
        try {
            const lowerEmail = email.toLowerCase()
            const user = await this.findUserByEmail(lowerEmail, true)

            if (!user || !(await this.isPasswordValid(password, user.password))) {
                const msg = 'Credenciais Inválidas'
                this.logger.warn(msg)
                throw new HttpException(msg, HttpStatus.FORBIDDEN);
            }

            const payload = { id: user.id }

            await queryRunner.commitTransaction()
            const accessToken = this.jwtService.sign(payload)

            const token = 'Bearer ' + accessToken
            const expiresInMs = Number(this.configService.get('JWT_EXPIRES_IN'))
            const expiresDate = new Date(Date.now() + expiresInMs)

            res.cookie('access_token', token, {
                expires: expiresDate,
                httpOnly: true,
                secure: this.configService.get('NODE_ENV') == 'production',
                sameSite: this.configService.get('NODE_ENV') == 'production' ? 'none' : 'lax'
            });

            return { token, expiresDate };
        } catch (err) {
            await queryRunner.rollbackTransaction()
            this.logger.error(`Falha ao fazer login. ${err}`)
            throw err
        } finally {
            await queryRunner.release();
        }
    }

    async logout(res: Response) {
        try {
            res.clearCookie('access_token');
            res.status(HttpStatus.OK).json({ logged_out: true });
        } catch (err) {
            this.logger.error(`Falha ao fazer logout. ${err}`)
            throw err
        }
    }

    async forgotPassword({ email }: ForgottenPasswordDTO) {
        try {
            const user = await this.findUserByEmail(email, false)
            if (!user) {
                const msg = 'Não existe usuário para o email fornecido'
                this.logger.warn(msg)
                throw new HttpException(msg, HttpStatus.FORBIDDEN);
            }
            user.passwordResetToken = randomUUID()
            user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000)

            await this.userRepository.save(user)
        } catch (err) {
            const msg = 'Erro ao solicitar esquecimento de senha'
            this.logger.error(msg, err)
            throw err
        }
    }

    async resetPassword(body: ResetPasswordDTO) {
        try {
            const user = await this.dataSource.manager.findOne(User, {
                where: {
                    passwordResetToken: body.token,
                    passwordResetExpires: MoreThan(new Date(Date.now()))
                }
            })
            if (!user) {
                const msg = 'Token para reset de senha inválido'
                this.logger.warn(msg)
                throw new HttpException(msg, HttpStatus.FORBIDDEN);
            }
            user.password = await hash(body.password, 10)
            user.passwordResetExpires = null
            user.passwordResetToken = null

            await this.userRepository.save(user)
        } catch (err) {
            const msg = 'Erro ao fazer reset de senha'
            this.logger.error(msg, err)
            throw err
        }
    }

    private async findUserByEmail(email: string, getPassword: boolean): Promise<User | null> {
        return await this.dataSource.manager.findOne(User, {
            select: {
                id: true,
                password: getPassword
            },
            where: {
                email
            },
            relations: {
                companies: true
            }
        })
    }

    private async isPasswordValid(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return compare(plainPassword, hashedPassword);
    }
}