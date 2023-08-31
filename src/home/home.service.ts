import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HomeResponseDto } from './dto/home.dto';
import { Prisma } from '@prisma/client';

type CreateHomeParams = Omit<Prisma.HomeCreateInput, 'images' | 'realtor'> & {
  images: { url: string }[];
};

type UpdateHomeParams = Prisma.HomeUpdateInput;

@Injectable()
export class HomeService {
  constructor(private readonly prismaService: PrismaService) {}

  async getHomes(where: Prisma.HomeWhereInput): Promise<HomeResponseDto[]> {
    const homes = await this.prismaService.home.findMany({
      select: {
        id: true,
        address: true,
        city: true,
        price: true,
        property_type: true,
        number_of_bathrooms: true,
        number_of_bedrooms: true,
        images: {
          select: {
            url: true,
          },
          take: 1,
        },
      },
      where,
    });

    if (!homes.length) {
      throw new NotFoundException('No homes found');
    }

    return homes.map((home) => {
      const newHome = { ...home, image: home.images[0].url };
      delete newHome.images;
      return new HomeResponseDto(newHome);
    });
  }

  async getHome(where: Prisma.HomeWhereUniqueInput): Promise<HomeResponseDto> {
    const home = await this.prismaService.home.findUnique({
      select: {
        id: true,
        address: true,
        city: true,
        price: true,
        property_type: true,
        number_of_bathrooms: true,
        number_of_bedrooms: true,
        images: {
          select: {
            url: true,
          },
        },
      },
      where,
    });

    if (!home) {
      throw new NotFoundException('Home not found');
    }

    return new HomeResponseDto(home);
  }

  async createHome({
    address,
    number_of_bathrooms,
    number_of_bedrooms,
    city,
    land_size,
    price,
    property_type,
    images,
  }: CreateHomeParams) {
    const home = await this.prismaService.home.create({
      data: {
        address,
        number_of_bathrooms,
        number_of_bedrooms,
        city,
        land_size,
        price,
        property_type,
        realtor_id: 3,
      },
    });

    const homeImages = images.map((image) => {
      return { ...image, home_id: home.id };
    });

    await this.prismaService.image.createMany({ data: homeImages });

    return new HomeResponseDto(home);
  }

  async updateHome(data: UpdateHomeParams, id: number) {
    const home = await this.prismaService.home.findUnique({
      where: { id },
    });

    if (!home) {
      throw new NotFoundException('Home not found');
    }

    const updatedHome = await this.prismaService.home.update({
      where: { id },
      data,
    });

    return new HomeResponseDto(updatedHome);
  }

  async deleteHome(id: number) {
    await this.prismaService.image.deleteMany({
      where: { home_id: id },
    });
    await this.prismaService.home.delete({ where: { id } });
  }
}
