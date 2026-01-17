import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { WebResponse } from 'src/types/response/response.type';
import { RoleResponse } from 'src/types/response/role.type';
import { RolesService } from './roles.service';

@Controller('roles')
@Public()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<WebResponse> {
    const result = await this.rolesService.findAll();
    return {
      message: result.message,
      data: result.datas,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<RoleResponse> {
    const result = await this.rolesService.findOne(id);
    return {
      message: result.message,
      data: result.data,
    };
  }
}
