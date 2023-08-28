import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignUpDto } from '../dtos/auth.dto';
import * as bcrypt from 'bcryptjs';
import { UserType } from '@prisma/client';

type SignUpParams = {
  [K in keyof SignUpDto]: SignUpDto[K];
};

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async signUp(params: SignUpParams) {
    const { email, password } = params;

    const foundUser = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (foundUser) {
      throw new ConflictException('This email is already taken');
    }

    const hashedPassword = await this.hashPassword(password);

    const user = await this.prismaService.user.create({
      data: {
        ...params,
        user_type: UserType.BUYER,
        password: hashedPassword,
      },
    });

    return user;
  }

  private async hashPassword(password: string) {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }
}
