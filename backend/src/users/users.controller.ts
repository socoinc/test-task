import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRequest } from '../common/types/authenticated-request';
import { UpdateMeDto } from './dto/update-me.dto';
import { UsersService } from './users.service';

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Req() request: AuthenticatedRequest) {
    const user = await this.usersService.findById(request.user.id);

    return {
      user,
    };
  }

  @Patch('me')
  async updateMe(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateMeDto,
  ) {
    const user = await this.usersService.updateProfile(request.user.id, dto);

    return {
      user,
    };
  }

  @Patch('me/deactivate')
  async deactivateMe(@Req() request: AuthenticatedRequest) {
    const user = await this.usersService.deactivate(request.user.id);

    return {
      user,
    };
  }
}
