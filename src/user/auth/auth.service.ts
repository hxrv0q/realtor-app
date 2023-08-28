import { ConflictException, HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { Prisma, UserType } from '@prisma/client';

type SignUpParams = Omit<Prisma.UserCreateInput, 'user_type'> & {
  password: string;
};
type SignInParams = Prisma.UserWhereUniqueInput & { password: string };

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async signUp(data: SignUpParams) {
    const { email, password, name } = data;

    const foundUser = await this.getUserByEmail(email);

    if (foundUser) {
      throw new ConflictException('This email is already taken');
    }

    const hashedPassword = await this.hashPassword(password);
    const user = await this.createUser({ ...data, password: hashedPassword });

    return this.generateToken({ name, id: user.id });
  }

  async signIn({ email, password }: SignInParams) {
    const user = await this.getUserByEmail(email);

    if (!user) {
      throw new HttpException('Invalid credentials', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new HttpException('Invalid credentials', 401);
    }

    return this.generateToken({ name: user.name, id: user.id });
  }

  private async createUser(data: SignUpParams) {
    return this.prismaService.user.create({
      data: {
        ...data,
        user_type: UserType.BUYER,
      },
    });
  }

  private async getUserByEmail(email: string) {
    return this.prismaService.user.findUnique({
      where: { email },
    });
  }

  private async hashPassword(password: string) {
    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    return bcrypt.hash(password, salt);
  }

  private generateToken(payload: { name: string; id: number }) {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN;

    if (!secret || !expiresIn) {
      throw new Error(
        'JWT secret and expiration must be defined in environment variables',
      );
    }

    return jwt.sign(payload, secret, { expiresIn });
  }
}
