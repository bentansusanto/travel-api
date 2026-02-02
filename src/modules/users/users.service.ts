import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Hashids from 'hashids';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AuthResponse } from 'src/types/response/auth.type';
import { Repository } from 'typeorm';
import { Logger } from 'winston';
import { RegisterDto } from './dto/register.dto';
import { UpdateUserDto } from './dto/update.dto';
import { Roles } from './entities/role.entity';
import { Session } from './entities/session.entity';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private hashIds: Hashids;
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Roles)
    private readonly roleRepository: Repository<Roles>,
  ) {
    this.hashIds = new Hashids(process.env.ID_SECRET, 10);
  }

  // create new user for role self register
  async create(createUserDto: RegisterDto): Promise<any> {
    try {
      // Generate tokens
      const tokens = crypto.randomBytes(40).toString('hex');
      const tokenVerify = `${tokens}-${Date.now()}`;

      const hashPassword = await bcrypt.hash(createUserDto.password, 10);

      const userData: any = {
        id: this.hashIds.encode(Date.now()),
        name: createUserDto.name,
        email: createUserDto.email,
        password: hashPassword,
        verify_code: tokenVerify,
        verify_code_expires_at: new Date(Date.now() + 60 * 60 * 1000),
      };

      // Only set role if role_id is provided
      if (createUserDto.role_id) {
        userData.role = { id: createUserDto.role_id };
      }

      const newUser = this.userRepository.create(userData);

      const savedUser = (await this.userRepository.save(
        newUser,
      )) as unknown as User;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = savedUser;
      return result;
    } catch (error) {
      this.logger.error('Error creating user:', error);
      throw error;
    }
  }

  // create new user for role owner
  async createUser(reqDto: RegisterDto): Promise<AuthResponse> {
    try {
      const findUser = await this.findByEmail(reqDto.email);
      if (findUser) {
        throw new Error('User already exists');
      }

      const hashPassword = await bcrypt.hash(reqDto.password, 10);
      const tokens = crypto.randomBytes(40).toString('hex');
      const tokenVerify = `${tokens}-${Date.now()}`;

      const userData: any = {
        id: this.hashIds.encode(Date.now()),
        name: reqDto.name,
        email: reqDto.email,
        password: hashPassword,
        verify_code: tokenVerify,
        is_verified: true,
        verify_code_expires_at: new Date(Date.now() + 60 * 60 * 1000),
      };

      // Only set role if role_id is provided
      if (reqDto.role_id) {
        userData.role = { id: reqDto.role_id };
      }

      const newUser = this.userRepository.create(userData);

      const savedUser = (await this.userRepository.save(
        newUser,
      )) as unknown as User;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = savedUser;
      return {
        message: 'User created successfully',
        data: {
          id: result.id,
          name: result.name,
          email: result.email,
          is_verified: result.is_verified,
          role_id: result.role.id,
          role: result.role,
        },
      };
    } catch (error) {
      this.logger.error('Error creating user:', error);
      if (error instanceof Error) {
        throw Error(error.message);
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // find all users
  async findAll(): Promise<AuthResponse> {
    try {
      const users = await this.userRepository.find({
        relations: ['role'],
      });
      if (!users || users.length === 0) {
        this.logger.error('No users found');
        throw new HttpException('No users found', HttpStatus.NOT_FOUND);
      }
      return {
        message: 'Users found successfully',
        datas: users.map((user) => {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            is_verified: user.is_verified,
            role_id: user.role.id,
            role: {
              id: user.role.id,
              name: user.role.name,
              code: user.role.code,
            },
          };
        }),
      };
    } catch (error) {
      this.logger.error('Error finding users:', error);
      if (error instanceof Error) {
        throw Error(error.message);
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // find user by id
  async findById(id: string): Promise<AuthResponse> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        relations: ['role'],
      });
      if (!user) {
        this.logger.error('User not found');
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return {
        message: 'User found successfully',
        data: {
          id: result.id,
          name: result.name,
          email: result.email,
          is_verified: result.is_verified,
          role_id: result.role.id,
          role: result.role,
        },
      };
    } catch (error) {
      this.logger.error('Error finding user:', error);
      if (error instanceof Error) {
        throw Error(error.message);
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // find user by email
  async findByEmail(email: string): Promise<any> {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
        relations: ['role'],
      });
      return user;
    } catch (error) {
      this.logger.error('Error finding user:', error);
      throw error;
    }
  }

  // find user by verify code
  async findByVerifyCode(verifyCode: string): Promise<any> {
    try {
      const user = await this.userRepository.findOne({
        where: { verify_code: verifyCode },
        relations: ['role'],
      });
      const { password, ...result } = user;
      return result;
    } catch (error) {
      this.logger.error('Error finding user:', error);
      throw error;
    }
  }

  // update user
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<AuthResponse> {
    try {
      const user = await this.userRepository.findOneBy({ id });
      if (!user) {
        throw new Error('User not found');
      }
      const hashPassword = await bcrypt.hash(updateUserDto.password, 10);

      const updatedUser = this.userRepository.create({
        ...user,
        ...updateUserDto,
        password: hashPassword,
      });
      const savedUser = await this.userRepository.save(updatedUser);
      const { password, verify_code, ...result } = savedUser;
      return {
        message: 'User updated successfully',
        data: {
          id: result.id,
          name: result.name,
          email: result.email,
          is_verified: result.is_verified,
          role_id: result.role.id,
          role: result.role,
        },
      };
    } catch (error) {
      this.logger.error('Error updating user:', error);
      if (error instanceof Error) {
        throw Error(error.message);
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // delete user
  async delete(id: string): Promise<any> {
    try {
      const user = await this.userRepository.findOneBy({ id });
      if (!user) {
        throw new Error('User not found');
      }
      await this.userRepository.softDelete({ id });
      return { message: 'User deleted successfully' };
    } catch (error) {
      this.logger.error('Error deleting user:', error);
      if (error instanceof Error) {
        throw Error(error.message);
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // find token by refresh token
  async findByRefreshToken(refreshToken: string): Promise<any> {
    try {
      const token = await this.sessionRepository.findOneBy({
        token: refreshToken,
      });
      return token;
    } catch (error) {
      this.logger.error('Error finding token by refresh token', error.stack);
      return null;
    }
  }

  // save token
  async saveToken(id: string, refreshToken: string): Promise<any> {
    try {
      const user = await this.userRepository.findOneBy({ id });
      if (!user) {
        this.logger.error('User not found');
        throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
      }

      const savedUser = await this.userRepository.save({
        ...user,
        refresh_token: refreshToken,
        refresh_token_expires_at: new Date(),
      });

      this.logger.log('Token saved successfully', savedUser);

      return savedUser;
    } catch (error) {
      this.logger.error('Error saving token', error.stack);
      return null;
    }
  }

  // find role by id
  async findRoleById(id: string): Promise<Roles> {
    try {
      const role = await this.roleRepository.findOneBy({ id });
      return role;
    } catch (error) {
      this.logger.error('Error finding role:', error);
      throw error;
    }
  }

  // find role by code
  async findRoleByCode(code: string): Promise<Roles> {
    try {
      const role = await this.roleRepository.findOneBy({ code });
      return role;
    } catch (error) {
      this.logger.error('Error finding role by code:', error);
      throw error;
    }
  }
}
