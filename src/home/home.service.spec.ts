import { Test, TestingModule } from '@nestjs/testing';
import { HomeService, homeSelect } from './home.service';
import { PrismaService } from '../prisma/prisma.service';
import { PropertyType } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

const mockGetHomes = [
  {
    id: 6,
    address: '1111 Axe Ave',
    city: 'Dallas',
    price: 500000,
    propertyType: PropertyType.RESIDENTIAL,
    numberOfBathrooms: 5,
    numberOfBedrooms: 4,
    image: 'img5',
    images: [
      {
        url: 'img5',
      },
    ],
  },
];

const mockHome = {
  id: 1,
  address: '1111 Axe Ave',
  city: 'Dallas',
  price: 500000,
  propertyType: PropertyType.RESIDENTIAL,
  numberOfBathrooms: 5,
  numberOfBedrooms: 4,
  image: 'img5',
};

const mockImages = [
  { id: 1, url: 'src1' },
  { id: 2, url: 'src2' },
];

describe('HomeService', () => {
  let service: HomeService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeService,
        {
          provide: PrismaService,
          useValue: {
            home: {
              findMany: jest.fn().mockReturnValue([mockGetHomes]),
              create: jest.fn().mockReturnValue(mockHome),
            },
            image: {
              createMany: jest.fn().mockReturnValue(mockImages),
            },
          },
        },
      ],
    }).compile();

    service = module.get<HomeService>(HomeService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHomes', () => {
    const where = {
      city: 'Dallas',
    };

    it('should call prisma home.findMany with correct params', async () => {
      const mockPrismaFindManyHomes = jest.fn().mockReturnValue(mockGetHomes);

      jest
        .spyOn(prismaService.home, 'findMany')
        .mockImplementation(mockPrismaFindManyHomes);

      await service.getHomes(where);

      expect(mockPrismaFindManyHomes).toBeCalledWith({
        select: {
          ...homeSelect,
        },
        where,
      });
    });

    it('should throw not found exception', async () => {
      const mockPrismaFindManyHomes = jest.fn().mockReturnValue([]);

      jest
        .spyOn(prismaService.home, 'findMany')
        .mockImplementation(mockPrismaFindManyHomes);

      expect(service.getHomes(where)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createMany', () => {
    const mockCreateHomeParams = {
      address: '1111 Axe Ave',
      city: 'Dallas',
      price: 500000,
      property_type: PropertyType.RESIDENTIAL,
      number_of_bathrooms: 5,
      number_of_bedrooms: 4,
      land_size: 300,
      images: [{ url: 'src1' }],
    };

    const realtorId = 5;

    const homeImages = [{ home_id: 1, url: 'src1' }];

    it('should call prisma home.create with the correct payload', async () => {
      const mockCreatedHome = jest.fn().mockReturnValue(mockHome);

      jest
        .spyOn(prismaService.home, 'create')
        .mockImplementation(mockCreatedHome);

      await service.createHome(mockCreateHomeParams, realtorId);

      expect(mockCreatedHome).toBeCalledWith({
        data: {
          address: mockCreateHomeParams.address,
          number_of_bathrooms: mockCreateHomeParams.number_of_bathrooms,
          number_of_bedrooms: mockCreateHomeParams.number_of_bedrooms,
          city: mockCreateHomeParams.city,
          land_size: mockCreateHomeParams.land_size,
          price: mockCreateHomeParams.price,
          property_type: mockCreateHomeParams.property_type,
          realtor_id: realtorId,
        },
      });
    });

    it('should call prisma image.createMany with the correct paylod', async () => {
      const mockCreateManyImages = jest.fn().mockReturnValue(mockImages);

      jest
        .spyOn(prismaService.image, 'createMany')
        .mockImplementation(mockCreateManyImages);

      await service.createHome(mockCreateHomeParams, realtorId);

      expect(mockCreateManyImages).toBeCalledWith({
        data: homeImages,
      });
    });
  });
});
