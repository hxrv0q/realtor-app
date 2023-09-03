import { ConflictException, HttpException, Injectable } from '@nestjs/common';
import { Prisma, UserType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';
import { SignInDto, SignUpDto } from '../dtos/auth.dto';

type SignUpParams = SignUpDto;
type SignInParams = SignInDto;

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async signUp(
    { email, name, phone, password }: SignUpParams,
    userType: UserType,
  ) {
    const foundUser = await this.getUser({ email });
    if (foundUser) {
      throw new ConflictException('This email is already taken');
    }

    const hashedPassword = await this.hash(password);
    const user = await this.createUser(
      { email, name, phone, password: hashedPassword },
      userType,
    );

    return this.generateToken({ name: user.name, id: user.id });
  }

  async signIn({ email, password }: SignInParams) {
    const user = await this.getUser({ email });
    if (!user) {
      throw new HttpException('Invalid credentials', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new HttpException('Invalid credentials', 401);
    }

    return this.generateToken({ name: user.name, id: user.id });
  }

  async generateProductKey(email: string, userType: UserType) {
    const productKey = this.getProductKey(email, userType);
    return await this.hash(productKey);
  }

  async validateProductKey(
    body: SignUpParams & { productKey?: string },
    userType: UserType,
  ) {
    const validProductKey = this.getProductKey(body.email, userType);
    return await bcrypt.compare(validProductKey, body.productKey);
  }

  private async createUser(data: SignUpParams, userType: UserType) {
    return this.prismaService.user.create({
      data: {
        ...data,
        user_type: userType,
      },
    });
  }

  private async getUser(where: Prisma.UserWhereUniqueInput) {
    return this.prismaService.user.findUnique({ where });
  }

  private async hash(string: string) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(string, salt);
  }

  private generateToken(payload: { name: string; id: number }) {
    const secret = process.env.JSON_SECRET_KEY;
    if (!secret) {
      throw new Error('JWT secret must be defined in environment variables');
    }
    return jwt.sign(payload, secret, { expiresIn: '7d' });
  }

  private getProductKey(email: string, userType: UserType) {
    const secret = process.env.PRODUCT_KEY_SECRET;
    return `${email}-${userType}-${secret}`;
  }
}
