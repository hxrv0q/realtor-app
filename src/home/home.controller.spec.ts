import { Test, TestingModule } from '@nestjs/testing';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { PrismaService } from '../prisma/prisma.service';
import { PropertyType } from '@prisma/client';
import { UnauthorizedException } from '@nestjs/common';

describe('HomeController', () => {
  let controller: HomeController;
  let service: HomeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HomeController],
      providers: [
        {
          provide: HomeService,
          useValue: {
            getHomes: jest.fn().mockReturnValue([]),
            getRealtorByHome: jest.fn().mockReturnValue({
              id: 1,
              name: 'John',
              email: 'example@example.com',
              phone: '555 555 5555',
            }),
            updateHome: jest.fn().mockReturnValue({
              id: 1,
              address: '123 Fake St.',
              city: 'Toronto',
              price: 1500000,
              property_type: PropertyType.RESIDENTIAL,
              image: 'https://via.placeholder.com/150',
              number_of_bedrooms: 3,
              number_of_bathrooms: 2,
            }),
          },
        },
        PrismaService,
      ],
    }).compile();

    controller = module.get<HomeController>(HomeController);
    service = module.get<HomeService>(HomeService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHomes', () => {
    it('should construct filter object correctly', async () => {
      const mockHomes = jest.fn().mockReturnValue([]);
      jest.spyOn(service, 'getHomes').mockImplementation(mockHomes);
      await controller.getHomes('Toronto', '1500000');

      expect(mockHomes).toHaveBeenCalledWith({
        city: 'Toronto',
        price: {
          gte: 1500000,
        },
      });
    });
  });

  describe('updateHome', () => {
    const mockUpdateHome = {
      address: '123 Fake St.',
      city: 'Toronto',
    };
    const mockUser = {
      name: 'John',
      id: 0,
      iat: 123456789,
      exp: 123456789,
    };

    it('should throw unauth error if realtor didnt create home', async () => {
      await expect(
        controller.updateHome(5, mockUpdateHome, mockUser),
      ).rejects.toThrowError(UnauthorizedException);
    });
  });
});
