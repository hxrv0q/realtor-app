import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { HomeService } from './home.service';
import { CreateHomeDto, HomeResponseDto, UpdateHomeDto } from './dto/home.dto';
import { User, UserInfo } from '../user/decorators/user.decorator';
import { UserType } from '@prisma/client';
import { AuthGuard } from '../guards/auth.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  async getHomes(
    @Query('city') city?: string,
    @Query('min_price') minPrice?: string,
    @Query('max_price') maxPrice?: string,
    @Query('property_type') propertyType?: string,
  ): Promise<HomeResponseDto[]> {
    const price =
      minPrice || maxPrice
        ? {
            ...(minPrice && { gte: parseFloat(minPrice) }),
            ...(maxPrice && { lte: parseFloat(maxPrice) }),
          }
        : undefined;

    const where = {
      ...(city && { city }),
      ...(price && { price }),
      ...(propertyType && { propertyType }),
    };

    return this.homeService.getHomes(where);
  }

  @Get(':id')
  async getHomeById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<HomeResponseDto> {
    return this.homeService.getHome({ id });
  }

  @Roles(UserType.REALTOR, UserType.ADMIN)
  @Post()
  async createHome(
    @Body() body: CreateHomeDto,
    @User() user: UserInfo,
  ): Promise<HomeResponseDto> {
    return this.homeService.createHome(body, user.id);
  }

  @Roles(UserType.REALTOR, UserType.ADMIN)
  @Put(':id')
  async updateHome(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateHomeDto,
    @User() user: UserInfo,
  ): Promise<HomeResponseDto> {
    const realtor = await this.homeService.getRealtorByHome(id);
    if (realtor.id !== user.id) {
      throw new UnauthorizedException();
    }

    return this.homeService.updateHome(body, id);
  }

  @Roles(UserType.REALTOR, UserType.ADMIN)
  @Delete(':id')
  async deleteHome(
    @Param('id', ParseIntPipe) id: number,
    @User() user: UserInfo,
  ) {
    const realtor = await this.homeService.getRealtorByHome(id);
    if (realtor.id !== user.id) {
      throw new UnauthorizedException();
    }

    return this.homeService.deleteHome(id);
  }
}
