import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from './users.service';
import { AuthResponse } from 'src/types/response/auth.type';
import { WebResponse } from 'src/types/response/response.type';
import { UpdateUserDto } from './dto/update.dto';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('users')
@Roles('owner', 'developer')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // create new user by owner
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: RegisterDto): Promise<WebResponse> {
    const result = await this.usersService.create(createUserDto);
    return{
      message: result.message,
      data: result.data
    }
  }

  // find all users
  @Get('find-all')
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<WebResponse> {
    const result = await this.usersService.findAll();
    return{
      message: result.message,
      data: result.datas
    }
  }

  // find user by id
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<WebResponse> {
    const result = await this.usersService.findById(id);
    return{
      message: result.message,
      data: result.data
    }
  }

  // update user by id
  @Put('update/:id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<WebResponse> {
    const result = await this.usersService.update(id, updateUserDto);
    return{
      message: result.message,
      data: result.data
    }
  }

  // delete user by id
  @Delete('delete/:id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string): Promise<WebResponse> {
    const result = await this.usersService.delete(id);
    return{
      message: result.message,
      data: result.data
    }
  }
}
