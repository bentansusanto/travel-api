import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { RoleResponse } from 'src/types/response/role.type';
import { Repository } from 'typeorm';
import { Logger } from 'winston';
import { Roles } from '../entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
    @InjectRepository(Roles)
    private readonly rolesRepository: Repository<Roles>,
  ) {}

  async findAll(): Promise<RoleResponse> {
    try {
      const roles = await this.rolesRepository.find();
      if (!roles) {
        this.logger.error('Roles not found');
        throw new HttpException('Roles not found', HttpStatus.NOT_FOUND);
      }
      return {
        message: 'Success',
        datas: roles.map((role) => ({
          id: role.id,
          name: role.name,
          code: role.code,
          self_register: role.self_register,
          created_at: role.createdAt,
          updated_at: role.updatedAt,
        })),
      };
    } catch (error) {
      this.logger.error('Error findAll roles', error);
    }
  }

  async findOne(id: string): Promise<RoleResponse> {
    try {
      const role = await this.rolesRepository.findOne({ where: { id } });
      if (!role) {
        this.logger.error('Role not found');
        throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
      }
      return {
        message: 'Success',
        data: {
          id: role.id,
          name: role.name,
          code: role.code,
          self_register: role.self_register,
          created_at: role.createdAt,
          updated_at: role.updatedAt,
        },
      };
    } catch (error) {
      this.logger.error('Error findOne role', error);
    }
  }
}
