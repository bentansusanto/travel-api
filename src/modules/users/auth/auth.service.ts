import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { EmailService } from 'src/common/emails/emails.service';
import { EmailType } from 'src/types/email.type';
import { AuthResponse } from 'src/types/response/auth.type';
import { Repository } from 'typeorm';

import { EmailReqDto } from '../dto/email_req.dto';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { ResetPasswordDto } from '../dto/reset_password.dto';
import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';
import { UsersService } from '../users.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  // register user
  async register(userDto: RegisterDto): Promise<AuthResponse> {
    try {
      let role: any;

      // If role_id is provided, use it. Otherwise, auto-assign role based on site
      if (userDto.role_id) {
        role = await this.usersService.findRoleById(userDto.role_id);
        if (!role) {
          this.logger.error('Role not found');
          throw new HttpException('Role not found', HttpStatus.BAD_REQUEST);
        }
      } else {
        // Auto-assign role based on site
        const targetRoleCode = userDto.site === 'admin' ? 'owner' : 'traveller';
        role = await this.usersService.findRoleByCode(targetRoleCode);

        if (!role) {
          this.logger.error(`${targetRoleCode} role not found in database`);
          throw new HttpException(
            `${targetRoleCode} role not found. Please contact administrator.`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
        // Set role_id for user creation
        userDto.role_id = role.id;
      }

      // check if role allows self register
      if (role.self_register === false) {
        this.logger.error(
          'User cannot register',
          'role.self_register',
          role.self_register,
        );
        throw new HttpException('User cannot register', HttpStatus.BAD_REQUEST);
      }

      // if user as owner register more than 1 user
      if (role.code === 'owner') {
        const countUser = await this.userRepository.count({
          where: {
            role: {
              id: role.id,
            },
          },
        });
        if (countUser >= 2) {
          this.logger.error(
            'User as owner cannot register',
            'countUser',
            countUser,
          );
          throw new HttpException(
            'User as owner cannot register',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // check if user exists
      const findUser = await this.usersService.findByEmail(userDto.email);
      if (findUser) {
        this.logger.error('User already exists');
        throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
      }

      const user = await this.usersService.create(userDto);

      // Send verification email
      const links =
        role.code === 'traveller'
          ? process.env.CLIENT_SITE
          : process.env.ADMIN_SITE;
      const baseSite = (links || '').replace(/\/+$/, '');
      await this.emailService.sendMail(EmailType.VERIFY_ACCOUNT, {
        links: `${baseSite}/verify-account?verify_token=${user.verify_code}`,
        email: user.email,
        subjectMessage: 'Verify your account',
      });

      this.logger.debug(
        `User registered successfully, check your email for verification`,
      );

      return {
        message:
          'User registered successfully, check your email for verification',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          is_verified: user.is_verified,
          role_id: user.role?.id,
        },
      };
    } catch (error) {
      this.logger.error(`Registration error: ${error.message}`, error.stack);

      // If it's already an HttpException, just rethrow it
      if (error instanceof HttpException) {
        throw error;
      }

      // For other unexpected errors
      throw new HttpException(
        {
          Error: [{ field: 'general', body: 'Error during registration' }],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // verify account user
  async verifyAccount(token: string): Promise<AuthResponse> {
    try {
      const user = await this.usersService.findByVerifyCode(token);
      if (!user) {
        throw new HttpException(
          'Invalid verification token',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (user.is_verified === true) {
        throw new HttpException(
          'Account already verified',
          HttpStatus.BAD_REQUEST,
        );
      }

      user.is_verified = true;
      user.verify_code = null;
      user.verify_code_expires_at = null;

      await this.userRepository.save(user);
      return {
        message: 'Account verified successfully',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          is_verified: user.is_verified,
          role_id: user.role_id,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error verifying account');
      throw new HttpException(
        'Error verifying account',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // resend account user
  async resendVerifyAccount(reqDto: EmailReqDto): Promise<AuthResponse> {
    try {
      const user = await this.usersService.findByEmail(reqDto.email);
      if (!user) {
        this.logger.error('User not found');
        throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
      }

      if (user.is_verified === true) {
        this.logger.error('User already verified');
        throw new HttpException(
          'User already verified',
          HttpStatus.BAD_REQUEST,
        );
      }

      const tokens = crypto.randomBytes(40).toString('hex');

      const tokenVerify = `${tokens}-${Date.now()}`;
      user.verify_code = tokenVerify;
      user.verify_code_expires_at = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

      // send email for verification account
      const links =
        user.role.code === 'traveller'
          ? process.env.CLIENT_SITE
          : process.env.ADMIN_SITE;
      const baseSite = (links || '').replace(/\/+$/, '');
      this.emailService.sendMail(EmailType.VERIFY_ACCOUNT, {
        links: `${baseSite}/verify-account?verify_token=${tokenVerify}`,
        email: user.email,
        subjectMessage: 'Verify your account',
      });

      this.logger.log('User resend verify account successfully', user.id);

      await this.userRepository.save(user);
      return {
        message: 'Account resend verify successfully, please check your email',
      };
    } catch (error) {
      this.logger.error('Error verifying account');
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error verifying account',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // login user
  async login(reqDto: LoginDto, ip: string): Promise<AuthResponse> {
    try {
      // check user exists
      const user = await this.usersService.findByEmail(reqDto.email);
      if (!user) {
        this.logger.error('User not found');
        throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
      }

      const isMatch = await bcrypt.compare(reqDto.password, user.password);
      if (!isMatch) {
        this.logger.error('Invalid password');
        throw new HttpException('Invalid password', HttpStatus.BAD_REQUEST);
      }

      // Check if user has correct role based on site
      if (reqDto.site === 'admin') {
        // Admin site: Disallow traveller role
        if (user.role?.code === 'traveller') {
          this.logger.error(
            `Login denied: User with traveller role attempted admin login`,
          );
          throw new HttpException(
            'Access denied. Traveller accounts cannot login to admin panel.',
            HttpStatus.FORBIDDEN,
          );
        }
      }

      // generate token
      const token = crypto.randomBytes(100).toString('hex').toUpperCase();
      const accessTokenExpiresAt = new Date();
      accessTokenExpiresAt.setHours(accessTokenExpiresAt.getHours() + 1);
      const refreshTokenExpiresAt = new Date();
      // set per day
      refreshTokenExpiresAt.setHours(refreshTokenExpiresAt.getHours() + 24);

      // save token
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const session = this.sessionRepository.create({
        token: tokenHash,
        user: {
          id: user.id,
        },
        expiresAt: refreshTokenExpiresAt,
        ip: ip,
      });
      await this.sessionRepository.save(session);

      return {
        message: 'Account login successfully',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          is_verified: user.is_verified,
          role_id: user.role.id,
          session: token,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error login account', error);
      throw new HttpException('Error login account', HttpStatus.BAD_REQUEST);
    }
  }

  // logout user
  async logout(token: string): Promise<AuthResponse> {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const session = await this.sessionRepository.findOne({
        where: { token: tokenHash },
      });

      if (!session) {
        throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
      }

      await this.sessionRepository.remove(session);
      return {
        message: 'Account logout successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error logout account', error);
      throw new HttpException('Error logout account', HttpStatus.BAD_REQUEST);
    }
  }

  // get user
  async getUser(id: string): Promise<AuthResponse> {
    try {
      const user = await this.usersService.findById(id);
      if (!user || user.is_verified === false) {
        this.logger.error('Account not verified or not register');
        throw new HttpException(
          {
            Error: [
              {
                field: 'user',
                body: 'Account not verified or not register',
              },
            ],
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      this.logger.log('Successfully get user');
      return {
        message: 'Successfully get user',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role_id: user.role?.id,
          is_verified: user.is_verified,
          role: {
            id: user.role?.id,
            name: user.role?.name,
            code: user.role?.code,
          },
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error get user', error);
      throw new HttpException('Error get user', HttpStatus.BAD_REQUEST);
    }
  }

  // refresh token
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const tokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      // Find the session in the database
      const session = await this.sessionRepository.findOne({
        where: { token: tokenHash },
        relations: ['user', 'user.role'],
      });

      if (!session) {
        this.logger.error(
          'Session not found (Potential Token Reuse or Invalid Token)',
          'RefreshToken',
        );
        throw new HttpException('Session not found', HttpStatus.BAD_REQUEST);
      }

      // Check expiration
      if (session.expiresAt && new Date() > session.expiresAt) {
        await this.sessionRepository.remove(session);
        this.logger.error('Session expired', 'RefreshToken');
        throw new HttpException('Session expired', HttpStatus.BAD_REQUEST);
      }

      const user = session.user;

      // Delete old session
      await this.sessionRepository.remove(session);

      // Generate new token
      const newToken = crypto.randomBytes(100).toString('hex').toUpperCase();
      const newTokenHash = crypto
        .createHash('sha256')
        .update(newToken)
        .digest('hex');

      const newExpiresAt = new Date();
      newExpiresAt.setHours(newExpiresAt.getHours() + 24);

      // Save new session
      const newSession = this.sessionRepository.create({
        token: newTokenHash,
        user: {
          id: user.id,
        },
        expiresAt: newExpiresAt,
        ip: session.ip, // Preserve IP from old session
      });
      await this.sessionRepository.save(newSession);

      this.logger.log('Successfully refresh token');
      return {
        message: 'Successfully refresh token',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role_id: user.role?.id,
          is_verified: user.is_verified,
          session: newToken,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error refresh token', error);
      throw new HttpException('Error refresh token', HttpStatus.BAD_REQUEST);
    }
  }

  // forgot password
  async forgotPassword(email: string): Promise<AuthResponse> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        this.logger.error('User not found');
        throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
      }

      const tokens = crypto.randomBytes(40).toString('hex');

      const tokenVerify = `${tokens}-${Date.now()}`;
      user.verify_code = tokenVerify;
      user.verify_code_expires_at = new Date();
      user.verify_code_expires_at.setHours(
        user.verify_code_expires_at.getHours() + 24,
      );

      await this.userRepository.save(user);
      // send email for verification account
      const links =
        user.role.code === 'traveller'
          ? process.env.CLIENT_SITE
          : process.env.ADMIN_SITE;
      const baseSite = (links || '').replace(/\/+$/, '');
      this.emailService.sendMail(EmailType.RESET_PASSWORD, {
        links: `${baseSite}/reset-password?verify_token=${tokenVerify}`,
        email: user.email,
        subjectMessage: 'Reset password',
      });

      this.logger.log('User resend verify account successfully', user.id);

      await this.userRepository.save(user);
      return {
        message: 'Account verified successfully, check your email',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error verifying account');
      throw new HttpException(
        'Error verifying account',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // reset password
  async resetPassword(
    token: string,
    resetDto: ResetPasswordDto,
  ): Promise<AuthResponse> {
    try {
      if (token === '') {
        this.logger.error('Token not found');
        throw new HttpException('Token not found', HttpStatus.BAD_REQUEST);
      }
      const user = await this.usersService.findByVerifyCode(token);
      if (!user) {
        this.logger.error('User not found');
        throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
      }

      user.password = resetDto.password;
      user.verify_code = null;
      user.verify_code_expires_at = null;

      await this.usersService.update(user.id, user);

      // send email for verification account
      this.emailService.sendMail(EmailType.VERIFY_ACCOUNT, {
        links: null,
        email: user.email,
        subjectMessage: 'Success reset password',
      });

      this.logger.log('User reset password successfully', user.id);

      return {
        message: 'User reset password successfully',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          is_verified: user.is_verified,
          role_id: user.role.id,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error logging out', error.stack);
      throw new HttpException(
        'Error logging out',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
