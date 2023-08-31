import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { GenerateProductKeyDto, SignInDto, SignUpDto } from '../dtos/auth.dto';
import { AuthService } from './auth.service';
import { UserType } from '@prisma/client';
import { User, UserInfo } from '../decorators/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup/:user_type')
  async signUp(
    @Body() body: SignUpDto,
    @Param('user_type', new ParseEnumPipe(UserType)) userType: UserType,
  ) {
    if (userType !== UserType.BUYER && !body.productKey) {
      throw new UnauthorizedException('The product key is required');
    }

    const isValidProductKey = await this.authService.validateProductKey(
      body,
      userType,
    );

    if (!isValidProductKey) {
      throw new UnauthorizedException('The product key is invalid');
    }

    return this.authService.signUp(body, userType);
  }

  @Post('/signin')
  async singIn(@Body() body: SignInDto) {
    return this.authService.signIn(body);
  }

  @Post('/key')
  generateProductKey(@Body() { email, userType }: GenerateProductKeyDto) {
    return this.authService.generateProductKey(email, userType);
  }

  @Get('/me')
  async getCurrentUser(@User() user: UserInfo) {
    return user;
  }
}
