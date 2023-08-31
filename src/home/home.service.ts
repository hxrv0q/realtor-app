import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HomeResponseDto } from './dto/home.dto';
import { Prisma } from '@prisma/client';
import { UserInfo } from '../user/decorators/user.decorator';

type CreateHomeParams = Omit<Prisma.HomeCreateInput, 'images' | 'realtor'> & {
  images: { url: string }[];
};

type UpdateHomeParams = Prisma.HomeUpdateInput;

export const homeSelect = {
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
};

@Injectable()
export class HomeService {
  constructor(private readonly prismaService: PrismaService) {}

  async getHomes(where: Prisma.HomeWhereInput): Promise<HomeResponseDto[]> {
    const homes = await this.prismaService.home.findMany({
      select: {
        ...homeSelect,
      },
      where,
    });

    if (!homes.length) {
      throw new NotFoundException('No homes found');
    }

    return homes.map((home) => {
      const newHome = { ...home, image: home.images[0]?.url };
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

  async createHome(
    {
      address,
      number_of_bathrooms,
      number_of_bedrooms,
      city,
      land_size,
      price,
      property_type,
      images,
    }: CreateHomeParams,
    userId: number,
  ) {
    const home = await this.prismaService.home.create({
      data: {
        address,
        number_of_bathrooms,
        number_of_bedrooms,
        city,
        land_size,
        price,
        property_type,
        realtor_id: userId,
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

  async getRealtorByHome(id: number) {
    const home = await this.prismaService.home.findUnique({
      where: { id },
      select: {
        realtor: {
          select: {
            name: true,
            id: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!home) {
      throw new NotFoundException('Home not found');
    }

    return home.realtor;
  }

  async inquire(buyer: UserInfo, homeId: number, message: string) {
    const realtor = await this.getRealtorByHome(homeId);

    const newMessage = await this.prismaService.message.create({
      data: {
        realtor_id: realtor.id,
        buyer_id: buyer.id,
        home_id: homeId,
        text: message,
      },
    });

    return newMessage;
  }

  async getMessagesByHome(homeId: number) {
    return this.prismaService.message.findMany({
      where: { home_id: homeId },
      select: {
        text: true,
        buyer: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });
  }
}
